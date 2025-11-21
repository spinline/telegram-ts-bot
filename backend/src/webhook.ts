import "dotenv/config";
import { Bot } from "grammy";

// Webhook ile gelen olayları işleyen modül
// RemnaWave Webhook Documentation: https://docs.rw/docs/features/webhooks

// Bildirim gönderilen kullanıcıları takip et (sadece bir kez gönder)
const notifiedUsers: Record<string, boolean> = {};

export interface WebhookEvent {
  event: string;
  timestamp: string;
  data: {
    user?: {
      uuid: string;
      username: string;
      status: string;
      telegramId?: number;
      usedTrafficBytes?: number;
      trafficLimitBytes?: number;
      expireAt?: string;
    };
  };
}

export async function handleWebhook(bot: Bot<any>, event: WebhookEvent, reasonOverride?: string) {
  try {
    const { event: eventType, data } = event;
    const user = data?.user;

    console.log('🔍 Processing webhook event:', eventType);
    console.log('👤 User data:', user);

    if (!user) {
      console.warn('⚠️ Webhook event received without user data:', eventType);
      return { ok: false, reason: 'no_user_data' };
    }

    const userUuid = user.uuid;
    const telegramId = user.telegramId;

    console.log('🆔 User UUID:', userUuid);
    console.log('📱 Telegram ID:', telegramId);

    if (!telegramId) {
      console.log(`⚠️ User ${user.username} has no telegramId, skipping notification`);
      return { ok: false, reason: 'no_telegram_id' };
    }

    // Sadece status değişikliği veya kullanım olaylarında bildirim gönder
    const shouldNotify =
      eventType === 'user.status.changed' ||
      eventType === 'user.disabled' ||
      eventType === 'user.limited' ||
      eventType === 'user.expired';

    console.log('🔔 Should notify?', shouldNotify, '(event type:', eventType, ')');

    if (!shouldNotify) {
      console.log('⏭️ Event not relevant for notifications');
      return { ok: false, reason: 'event_not_relevant' };
    }

    // Kullanıcı kısıtlı mı?
    const isRestricted =
      user.status === 'LIMITED' ||
      user.status === 'EXPIRED' ||
      user.status === 'DISABLED';

    console.log('🚫 User restricted?', isRestricted, '(status:', user.status, ')');

    if (!isRestricted) {
      console.log('✅ User not restricted, skipping notification');
      return { ok: false, reason: 'user_not_restricted' };
    }

    // Daha önce bildirim gönderildiyse atla
    if (notifiedUsers[userUuid]) {
      console.log(`⏭️ User ${user.username} already notified, skipping`);
      return { ok: false, reason: 'already_notified' };
    }

    // Bildirim mesajını hazırla
    const reason =
      reasonOverride ||
      (user.status === 'LIMITED'
        ? 'Trafik kotanız doldu.'
        : user.status === 'EXPIRED'
        ? 'Abonelik süreniz sona erdi.'
        : 'Hesabınız devre dışı bırakıldı.');

    const text = `⚠️ Hesabınız kısıtlandı!\n\n${reason}\n\nHesap detaylarınızı görmek için aşağıdaki butona tıklayın.`;

    console.log('📤 Sending notification to Telegram ID:', telegramId);
    console.log('💬 Message:', text);

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
    console.log(`✅ Notification sent successfully to user ${user.username} (${telegramId})`);

    return { ok: true, event: eventType };
  } catch (e: any) {
    console.error('❌ Webhook handler error:', e?.message || e);
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

    console.log('🔐 Signature verification:');
    console.log('   Expected:', expectedSignature);
    console.log('   Received:', signature);
    console.log('   Match:', signature === expectedSignature);

    return signature === expectedSignature;
  } catch (e: any) {
    console.error('❌ Signature verification error:', e?.message || e);
    return false;
  }
}

