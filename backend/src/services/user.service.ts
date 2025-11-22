import { getAllUsers, getUserByUsername, getUserByTelegramId } from "../api";

/**
 * User Service
 * Business logic for user operations
 */
class UserService {
  /**
   * Get all users with pagination
   */
  async getUsers(page: number = 1, take: number = 100) {
    return await getAllUsers(page, take);
  }

  /**
   * Get user by Telegram ID
   */
  async getUserByTelegramId(telegramId: number) {
    return await getUserByTelegramId(telegramId);
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string) {
    return await getUserByUsername(username);
  }

  /**
   * Get users with Telegram ID
   */
  async getUsersWithTelegramId() {
    const users = await this.getUsers(1, 1000);
    return users.filter((u: any) => u.telegramId || u.telegram_id || u.tId);
  }

  /**
   * Format user details for display
   */
  formatUserDetails(user: any): string {
    const expireDate = new Date(user.expireAt);
    const now = new Date();
    const daysLeft = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const statusEmoji = user.status === 'ACTIVE' ? '🟢' :
                       user.status === 'LIMITED' ? '🟡' :
                       user.status === 'EXPIRED' ? '🔴' : '⚫';

    const trafficUsed = (user.usedTrafficBytes / 1024 / 1024 / 1024).toFixed(2);
    const trafficLimit = (user.trafficLimitBytes / 1024 / 1024 / 1024).toFixed(0);
    const trafficPercent = ((user.usedTrafficBytes / user.trafficLimitBytes) * 100).toFixed(0);

    let message = `👤 *Kullanıcı Detayları*\n\n`;
    message += `📝 Kullanıcı Adı: \`${user.username}\`\n`;
    message += `🆔 UUID: \`${user.uuid}\`\n`;
    message += `${statusEmoji} Durum: ${user.status}\n`;
    message += `🏷️ Tag: ${user.tag || 'N/A'}\n\n`;
    message += `📊 Trafik: ${trafficUsed} GB / ${trafficLimit} GB (%${trafficPercent})\n`;
    message += `📅 Bitiş: ${expireDate.toLocaleDateString('tr-TR')}\n`;
    message += `⏰ Kalan: ${daysLeft} gün\n`;
    message += `📱 Telegram ID: ${user.telegramId || 'Yok'}\n`;
    message += `📧 Email: ${user.email || 'Yok'}\n`;
    message += `📅 Oluşturulma: ${new Date(user.createdAt).toLocaleDateString('tr-TR')}\n`;

    return message;
  }

  /**
   * Get user statistics
   */
  async getStatistics() {
    const users = await this.getUsers(1, 1000);

    const total = users.length;
    const active = users.filter((u: any) => u.status === 'ACTIVE').length;
    const limited = users.filter((u: any) => u.status === 'LIMITED').length;
    const expired = users.filter((u: any) => u.status === 'EXPIRED').length;

    const totalTraffic = users.reduce((sum: number, u: any) =>
      sum + (parseInt(u.usedTrafficBytes) || 0), 0
    );
    const avgTraffic = total > 0 ? totalTraffic / total : 0;

    return {
      total,
      active,
      limited,
      expired,
      totalTraffic,
      avgTraffic
    };
  }
}

export const userService = new UserService();

