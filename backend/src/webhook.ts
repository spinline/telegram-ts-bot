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

    // RemnaWave user data'yı farklı formatlarda gönderebilir:
    // Format 1: { event: "...", data: { user: {...} } }
    // Format 2: { event: "...", data: {...} } (direkt user)
    // Format 3: { event: "...", uuid: "...", username: "..." } (root'ta)

    let user = data?.user || data || event;

    console.log('🔍 Processing webhook event:', eventType);
    console.log('👤 User data:', JSON.stringify(user, null, 2));

    if (!user || !user.uuid) {
      console.warn('⚠️ Webhook event received without valid user data:', eventType);
      return { ok: false, reason: 'no_user_data' };
    }

    const userUuid = user.uuid;
    const telegramId = typeof user.telegramId === 'string' ? parseInt(user.telegramId) : user.telegramId;

    console.log('🆔 User UUID:', userUuid);
    console.log('👤 Username:', user.username);
    console.log('📱 Telegram ID:', telegramId);
    console.log('📊 Status:', user.status);

    if (!telegramId) {
      console.log(`⚠️ User ${user.username} has no telegramId, skipping notification`);
      return { ok: false, reason: 'no_telegram_id' };
    }

    // Trafik kontrolü - usedTrafficBytes > trafficLimitBytes ise LIMITED olarak değerlendir
    const usedTraffic = typeof user.usedTrafficBytes === 'string' ? parseInt(user.usedTrafficBytes) : user.usedTrafficBytes || 0;
    const limitTraffic = typeof user.trafficLimitBytes === 'string' ? parseInt(user.trafficLimitBytes) : user.trafficLimitBytes || 0;
    const isTrafficExceeded = usedTraffic > limitTraffic;

    console.log('📈 Traffic Check:');
    console.log('   Used:', usedTraffic, 'bytes');
    console.log('   Limit:', limitTraffic, 'bytes');
    console.log('   Exceeded:', isTrafficExceeded);

    // Süre kontrolü - expireAt geçmiş mi?
    const isExpired = user.expireAt ? new Date(user.expireAt) < new Date() : false;
    console.log('⏰ Expiration Check:');
    console.log('   ExpireAt:', user.expireAt);
    console.log('   Expired:', isExpired);

    // Sadece status değişikliği veya kullanım olaylarında bildirim gönder
    const shouldNotify =
      eventType === 'user.status.changed' ||
      eventType === 'user.disabled' ||
      eventType === 'user.limited' ||
      eventType === 'user.expired' ||
      eventType === 'user.modified';  // RemnaWave bu event'i gönderiyor

    console.log('🔔 Should notify?', shouldNotify, '(event type:', eventType, ')');

    if (!shouldNotify) {
      console.log('⏭️ Event not relevant for notifications');
      return { ok: false, reason: 'event_not_relevant' };
    }

    // Kullanıcı kısıtlı mı?
    // Status kontrolü VEYA trafik aşımı VEYA süre dolumu
    const isRestricted =
      user.status === 'LIMITED' ||
      user.status === 'EXPIRED' ||
      user.status === 'DISABLED' ||
      isTrafficExceeded ||
      isExpired;

    console.log('🚫 User restricted?', isRestricted);
    console.log('   Reasons:', {
      statusLimited: user.status === 'LIMITED',
      statusExpired: user.status === 'EXPIRED',
      statusDisabled: user.status === 'DISABLED',
      trafficExceeded: isTrafficExceeded,
      expired: isExpired
    });

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

