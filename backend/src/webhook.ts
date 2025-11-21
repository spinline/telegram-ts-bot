import "dotenv/config";
import { Bot } from "grammy";

// Webhook ile gelen olayları işleyen modül
// RemnaWave Webhook Documentation: https://docs.rw/docs/features/webhooks

// Bildirim gönderilen kullanıcıları takip et (sadece bir kez gönder)
const notifiedUsers: Record<string, boolean> = {};

export interface WebhookEvent {
  event: string;
  timestamp: string;
  data?: any;  // RemnaWave direkt user object'i gönderebilir
  uuid?: string;  // User bilgileri root'ta da olabilir
  username?: string;
  status?: string;
  telegramId?: number | string;
  usedTrafficBytes?: number | string;
  trafficLimitBytes?: number | string;
  expireAt?: string;
}

export async function handleWebhook(bot: Bot<any>, event: WebhookEvent, reasonOverride?: string) {
  try {
    const { event: eventType, data } = event;

    // RemnaWave user data'yı farklı formatlarda gönderebilir
    let user = data?.user || data || event;

    if (!user || !user.uuid) {
      console.warn('⚠️ Webhook: Invalid user data for event:', eventType);
      return { ok: false, reason: 'no_user_data' };
    }

    const userUuid = user.uuid;
    const telegramId = typeof user.telegramId === 'string' ? parseInt(user.telegramId) : user.telegramId;

    if (!telegramId) {
      console.log(`⚠️ Webhook: User ${user.username} has no Telegram ID, skipping`);
      return { ok: false, reason: 'no_telegram_id' };
    }

    // Trafik kontrolü
    const usedTraffic = typeof user.usedTrafficBytes === 'string' ? parseInt(user.usedTrafficBytes) : user.usedTrafficBytes || 0;
    const limitTraffic = typeof user.trafficLimitBytes === 'string' ? parseInt(user.trafficLimitBytes) : user.trafficLimitBytes || 0;
    const isTrafficExceeded = usedTraffic > limitTraffic;

    // Süre kontrolü
    const isExpired = user.expireAt ? new Date(user.expireAt) < new Date() : false;

    // Sadece relevant event'lerde bildirim gönder
    const shouldNotify =
      eventType === 'user.status.changed' ||
      eventType === 'user.disabled' ||
      eventType === 'user.limited' ||
      eventType === 'user.expired' ||
      eventType === 'user.modified';

    if (!shouldNotify) {
      return { ok: false, reason: 'event_not_relevant' };
    }

    // Kullanıcı kısıtlı mı?
    const isRestricted =
      user.status === 'LIMITED' ||
      user.status === 'EXPIRED' ||
      user.status === 'DISABLED' ||
      isTrafficExceeded ||
      isExpired;

    if (!isRestricted) {
      return { ok: false, reason: 'user_not_restricted' };
    }

    // Daha önce bildirim gönderildiyse atla
    if (notifiedUsers[userUuid]) {
      console.log(`⏭️ Webhook: User ${user.username} already notified`);
      return { ok: false, reason: 'already_notified' };
    }

    // Bildirim mesajını hazırla
    let reason = reasonOverride;
    if (!reason) {
      if (user.status === 'LIMITED' || isTrafficExceeded) {
        reason = 'Trafik kotanız doldu.';
      } else if (user.status === 'EXPIRED' || isExpired) {
        reason = 'Abonelik süreniz sona erdi.';
      } else {
        reason = 'Hesabınız devre dışı bırakıldı.';
      }
    }

    const text = `⚠️ Hesabınız kısıtlandı!\n\n${reason}\n\nHesap detaylarınızı görmek için aşağıdaki butona tıklayın.`;

    // Telegram bildirimi gönder
    await bot.api.sendMessage(telegramId, text, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '👤 Hesap Bilgilerim', callback_data: 'my_account' }]
        ]
      }
    });

    // Başarılı, kullanıcıyı işaretle
    notifiedUsers[userUuid] = true;
    console.log(`✅ Notification sent: ${user.username} (${telegramId}) - ${reason}`);

    return { ok: true, event: eventType };
  } catch (e: any) {
    console.error('❌ Webhook error:', e?.message || e);
    return { ok: false, error: e?.message || e };
  }
}

// Webhook imzasını doğrula (güvenlik için)
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    const isValid = signature === expectedSignature;

    if (!isValid) {
      console.warn('🔐 Signature mismatch - Expected:', expectedSignature.substring(0, 16) + '...');
    }

    return isValid;
  } catch (e: any) {
    console.error('❌ Signature verification error:', e?.message || e);
    return false;
  }
}

