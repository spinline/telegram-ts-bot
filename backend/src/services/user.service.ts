import { getAllUsers, getUserByUsername, getUserByTelegramId, updateUser, resetAllUserDevices, getUserHwidDevices } from "../api";

/**
 * User Service
 * Business logic for user operations
 */
class UserService {
  /**
   * Get all users with pagination and sorting
   */
  async getUsers(page: number = 1, take: number = 100, sortBy?: 'traffic' | 'date' | 'status') {
    const result = await getAllUsers(1, 1000); // Sıralama için daha fazla veri çekiyoruz (API desteği sınırlıysa)
    let users = result.users || [];

    // Sıralama Mantığı
    if (sortBy === 'traffic') {
      users.sort((a: any, b: any) => b.usedTrafficBytes - a.usedTrafficBytes);
    } else if (sortBy === 'date') {
      users.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'status') {
      const statusOrder: any = { 'ACTIVE': 1, 'LIMITED': 2, 'EXPIRED': 3, 'DISABLED': 4 };
      users.sort((a: any, b: any) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99));
    }

    // Sayfalama (Client-side pagination for sorted results)
    const total = users.length;
    const start = (page - 1) * take;
    const end = start + take;
    const paginatedUsers = users.slice(start, end);

    return { users: paginatedUsers, total };
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
    const { users } = await this.getUsers(1, 1000);
    return users.filter((u: any) => u.telegramId || u.telegram_id || u.tId);
  }

  /**
   * Get user details message with device info
   */
  async getUserDetailsMessage(username: string): Promise<string> {
    const user = await this.getUserByUsername(username);
    if (!user) throw new Error("Kullanıcı bulunamadı");
    
    let deviceCount = 0;
    try {
      const hwidData = await getUserHwidDevices(user.uuid);
      deviceCount = hwidData.total || (hwidData.devices ? hwidData.devices.length : 0);
    } catch (e) {
      console.error(`Failed to fetch devices for ${username}`, e);
    }
    
    return this.formatUserDetails(user, deviceCount);
  }

  /**
   * Format user details for display
   */
  formatUserDetails(user: any, deviceCount: number = 0): string {
    const expireDate = new Date(user.expireAt);
    const now = new Date();
    const daysLeft = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const statusEmoji = user.status === 'ACTIVE' ? '🟢' :
                       user.status === 'LIMITED' ? '🟡' :
                       user.status === 'EXPIRED' ? '🔴' : '⚫';

    const trafficUsed = (user.usedTrafficBytes / 1024 / 1024 / 1024).toFixed(2);
    const trafficLimit = (user.trafficLimitBytes / 1024 / 1024 / 1024).toFixed(0);
    const trafficPercent = user.trafficLimitBytes > 0 
      ? ((user.usedTrafficBytes / user.trafficLimitBytes) * 100).toFixed(0)
      : '0';

    let message = `👤 *Kullanıcı Detayları*\n\n`;
    message += `📝 Kullanıcı Adı: \`${user.username}\`\n`;
    message += `🆔 UUID: \`${user.uuid}\`\n`;
    message += `${statusEmoji} Durum: ${user.status}\n`;
    message += `🏷️ Tag: ${user.tag || 'N/A'}\n\n`;
    message += `📊 Trafik: ${trafficUsed} GB / ${trafficLimit} GB (%${trafficPercent})\n`;
    message += `📱 Bağlı Cihaz: ${deviceCount}\n`;
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
    const { users } = await this.getUsers(1, 1000);

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

  /**
   * Add traffic to user
   */
  async addTraffic(username: string, amountGB: number) {
    const user = await this.getUserByUsername(username);
    if (!user) throw new Error("Kullanıcı bulunamadı");

    const currentLimit = parseInt(user.trafficLimitBytes);
    const additionalBytes = amountGB * 1024 * 1024 * 1024;
    const newLimit = currentLimit + additionalBytes;

    return await updateUser(user.uuid, {
      trafficLimitBytes: newLimit,
      status: 'ACTIVE' // Trafik eklenince aktif et
    });
  }

  /**
   * Extend user expiration
   */
  async extendTime(username: string, days: number) {
    const user = await this.getUserByUsername(username);
    if (!user) throw new Error("Kullanıcı bulunamadı");

    const currentExpire = new Date(user.expireAt).getTime() > Date.now() 
      ? new Date(user.expireAt) 
      : new Date(); // Süresi bitmişse şimdiden başlat
    
    currentExpire.setDate(currentExpire.getDate() + days);

    return await updateUser(user.uuid, {
      expireAt: currentExpire.toISOString(),
      status: 'ACTIVE' // Süre eklenince aktif et
    });
  }

  /**
   * Reset user devices
   */
  async resetDevices(username: string) {
    const user = await this.getUserByUsername(username);
    if (!user) throw new Error("Kullanıcı bulunamadı");

    return await resetAllUserDevices(user.uuid);
  }
}

export const userService = new UserService();

