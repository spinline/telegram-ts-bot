import { telegramService } from "./telegram.service";
import { userService } from "./user.service";

/**
 * Notification Service
 * Handles all notification operations
 */
class NotificationService {
  /**
   * Send notification to user by Telegram ID
   */
  async sendToUser(telegramId: number, message: string) {
    try {
      await telegramService.sendMessage(telegramId, message);
      return true;
    } catch (e: any) {
      console.error(`Failed to send notification to ${telegramId}:`, e.message);
      return false;
    }
  }

  /**
   * Broadcast message to all users with Telegram ID
   */
  async broadcast(message: string) {
    const users = await userService.getUsersWithTelegramId();

    const userIds = users.map((u: any) =>
      u.telegramId || u.telegram_id || u.tId
    ).filter(Boolean);

    console.log(`📢 Broadcast: ${users.length} toplam kullanıcı, ${userIds.length} Telegram ID'li`);

    const result = await telegramService.broadcast(userIds, message);

    console.log(`✅ Broadcast tamamlandı: ${result.sent} başarılı, ${result.failed} başarısız`);

    return result;
  }

  /**
   * Send account limited notification
   */
  async sendAccountLimited(telegramId: number, reason: 'traffic' | 'expired') {
    const message = reason === 'traffic'
      ? `⚠️ *Hesabınız Kısıtlandı!*\n\nTrafik kotanız doldu.\n\nHizmetimizi kullanmaya devam etmek için lütfen yeni bir abonelik satın alın.`
      : `⚠️ *Hesabınız Kısıtlandı!*\n\nAbonelik süreniz sona erdi.\n\nHizmetimizi kullanmaya devam etmek için lütfen yeni bir abonelik satın alın.`;

    return await this.sendToUser(telegramId, message);
  }

  /**
   * Send welcome notification for new user
   */
  async sendWelcome(telegramId: number, username: string) {
    const message = `🎉 *Hoş Geldiniz!*\n\nMerhaba @${username}!\n\nDeneme hesabınız başarıyla oluşturuldu.\n\n/start komutu ile başlayabilirsiniz.`;
    return await this.sendToUser(telegramId, message);
  }
}

export const notificationService = new NotificationService();

