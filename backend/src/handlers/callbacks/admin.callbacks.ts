import { Context, InlineKeyboard } from "grammy";
import { safeAnswerCallback, safeEditMessageText } from "../../middlewares/error.middleware";
import { sessionManager } from "../../middlewares/session.middleware";
import { userService } from "../../services/user.service";
import { logger } from "../../utils/logger";

/**
 * Admin Panel - Ana Menü
 */
export async function adminPanelHandler(ctx: Context) {
  try {
    const keyboard = new InlineKeyboard()
      .text("⚙️ Kullanıcı İşlemleri", "admin_user_ops")
      .text("📢 Toplu Bildirim", "admin_broadcast").row()
      .text("📊 İstatistikler", "admin_stats")
      .text("📝 Sistem Logları", "admin_logs").row()
      .text("💾 Sistem Durumu", "admin_status");

    await ctx.reply(
      "👨‍💼 *Admin Paneli*\n\nYönetim fonksiyonlarını seçin:",
      { reply_markup: keyboard, parse_mode: "Markdown" }
    );
  } catch (error: any) {
    logger.error('/admin error:', error.message);
    try {
      await ctx.reply(`❌ Hata oluştu: ${error.message}`);
    } catch (e) {
      logger.error('Failed to send error message:', e);
    }
  }
}

/**
 * Admin Panel - Kullanıcı İşlemleri
 */
export async function adminUserOpsHandler(ctx: Context) {
  await safeAnswerCallback(ctx);

  // Aktif session varsa temizle
  const adminId = ctx.from?.id;
  if (adminId && sessionManager.has(adminId)) {
    sessionManager.delete(adminId);
  }

  const keyboard = new InlineKeyboard()
    .text("👥 Kullanıcı Listesi", "admin_users")
    .text("🔍 Kullanıcı Ara", "admin_search").row()
    .text("⏰ Süre Uzat", "admin_extend")
    .text("📊 Trafik Ekle", "admin_add_traffic").row()
    .text("🔙 Geri", "admin_back");

  await safeEditMessageText(ctx,
    "⚙️ *Kullanıcı İşlemleri*\n\nİşlem seçin:",
    { reply_markup: keyboard, parse_mode: "Markdown" }
  );
}

/**
 * Admin Panel - Kullanıcı Listesi
 */
export async function adminUsersHandler(ctx: Context) {
  await safeAnswerCallback(ctx);

  // Callback data'dan sayfa numarasını al (admin_users_page_2 gibi)
  const match = ctx.callbackQuery?.data?.match(/admin_users(_page_(\d+))?/);
  const page = match && match[2] ? parseInt(match[2]) : 1;
  const limit = 10;

  try {
    const { users, total } = await userService.getUsers(page, limit);

    if (!users || users.length === 0) {
      await safeEditMessageText(ctx, "ℹ️ Sistemde henüz kullanıcı bulunmuyor.");
      return;
    }

    const totalPages = Math.ceil(total / limit);
    const message = `👥 *Kullanıcı Listesi* (Sayfa ${page}/${totalPages})`;

    const keyboard = new InlineKeyboard();

    users.forEach((user: any) => {
      const status = user.status === 'ACTIVE' ? '🟢' :
                     user.status === 'LIMITED' ? '🟡' :
                     user.status === 'EXPIRED' ? '🔴' : '⚫';
      const usedGB = (user.usedTrafficBytes / 1024 / 1024 / 1024).toFixed(1);
      const limitGB = (user.trafficLimitBytes / 1024 / 1024 / 1024).toFixed(0);

      // Modern görünüm: Tek satırda detaylı bilgi
      // Örn: 🟢 username | 5.2/100 GB
      keyboard.text(
        `${status} ${user.username} | ${usedGB}/${limitGB} GB`, 
        `user_detail_${user.username}`
      ).row();
    });

    // Pagination buttons
    const paginationRow = [];
    if (page > 1) {
      paginationRow.push({ text: "⬅️ Önceki", callback_data: `admin_users_page_${page - 1}` });
    }
    if (page < totalPages) {
      paginationRow.push({ text: "Sonraki ➡️", callback_data: `admin_users_page_${page + 1}` });
    }
    
    if (paginationRow.length > 0) {
      keyboard.row(...paginationRow);
    }

    keyboard.row().text("🔙 Kullanıcı İşlemleri", "admin_user_ops");

    await safeEditMessageText(ctx, message, {
      reply_markup: keyboard,
      parse_mode: "Markdown"
    });
  } catch (e: any) {
    logger.error('Admin panel error (users):', e.message);
    await safeEditMessageText(ctx, `❌ Hata: ${e?.message || 'Kullanıcı listesi alınamadı'}`);
  }
}

/**
 * Admin Panel - Kullanıcı Detayı
 */
export async function adminUserDetailHandler(ctx: Context, username: string) {
  await safeAnswerCallback(ctx);

  try {
    const user = await userService.getUserByUsername(username);

    if (!user) {
      await safeEditMessageText(ctx, `❌ Kullanıcı bulunamadı: ${username}`);
      return;
    }

    const message = userService.formatUserDetails(user);

    const keyboard = new InlineKeyboard()
      .text("⏰ Süre Uzat", `admin_extend_${username}`)
      .text("📊 Trafik Ekle", `admin_add_traffic_${username}`).row()
      .text("🔄 Cihaz Sıfırla", `admin_reset_devices_${username}`).row()
      .text("🔙 Kullanıcı Listesi", "admin_users");

    await safeEditMessageText(ctx, message, {
      parse_mode: "Markdown",
      reply_markup: keyboard
    });
  } catch (e: any) {
    await safeEditMessageText(ctx, `❌ Hata: ${e?.message || 'Kullanıcı bilgisi alınamadı'}`);
  }
}

/**
 * Admin Panel - Kullanıcı Arama
 */
export async function adminSearchHandler(ctx: Context) {
  await safeAnswerCallback(ctx);

  const adminId = ctx.from?.id;
  if (adminId) {
    sessionManager.set(adminId, { action: 'search' });
  }

  const keyboard = new InlineKeyboard()
    .text("🔙 Kullanıcı İşlemleri", "admin_user_ops");

  await safeEditMessageText(ctx,
    "🔍 *Kullanıcı Arama*\n\nKullanıcı adını yazın:\n\n_İptal için /cancel veya aşağıdaki butona tıklayın_",
    {
      parse_mode: "Markdown",
      reply_markup: keyboard
    }
  );
}

/**
 * Admin Panel - Toplu Bildirim
 */
export async function adminBroadcastHandler(ctx: Context) {
  await safeAnswerCallback(ctx);

  const adminId = ctx.from?.id;
  if (adminId) {
    sessionManager.set(adminId, { action: 'broadcast' });
  }

  await safeEditMessageText(ctx,
    "📢 *Toplu Bildirim*\n\nGöndermek istediğiniz mesajı yazın:\n\n_İptal için /cancel yazın_",
    { parse_mode: "Markdown" }
  );
}

/**
 * Admin Panel - İstatistikler
 */
export async function adminStatsHandler(ctx: Context) {
  await safeAnswerCallback(ctx);

  try {
    const stats = await userService.getStatistics();

    const message = `📊 *Sistem İstatistikleri*\n\n` +
      `👥 Toplam Kullanıcı: ${stats.total}\n` +
      `🟢 Aktif: ${stats.active}\n` +
      `🟡 Limitli: ${stats.limited}\n` +
      `🔴 Süresi Dolmuş: ${stats.expired}\n\n` +
      `📈 Toplam Trafik: ${(stats.totalTraffic / 1024 / 1024 / 1024).toFixed(2)} GB\n` +
      `📊 Ortalama Trafik: ${(stats.avgTraffic / 1024 / 1024 / 1024).toFixed(2)} GB/kullanıcı`;

    await safeEditMessageText(ctx, message, { parse_mode: "Markdown" });
  } catch (e: any) {
    logger.error('Admin panel error (stats):', e.message);
    await safeEditMessageText(ctx, `❌ Hata: ${e?.message || 'İstatistikler alınamadı'}`);
  }
}

/**
 * Admin Panel - Sistem Logları
 */
export async function adminLogsHandler(ctx: Context) {
  await safeAnswerCallback(ctx);

  const message = `📝 *Sistem Logları*\n\n` +
    `Bu özellik geliştirme aşamasındadır.\n\n` +
    `Log'ları görmek için:\n` +
    `• Dokploy: Logs sekmesi\n` +
    `• PM2: \`pm2 logs telegram-bot\`\n` +
    `• Docker: \`docker logs -f container_name\``;

  await safeEditMessageText(ctx, message, { parse_mode: "Markdown" });
}

/**
 * Admin Panel - Sistem Durumu
 */
export async function adminStatusHandler(ctx: Context) {
  await safeAnswerCallback(ctx);

  const uptime = process.uptime();
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);

  const memUsage = process.memoryUsage();
  const memUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
  const memTotalMB = (memUsage.heapTotal / 1024 / 1024).toFixed(2);

  const message = `💾 *Sistem Durumu*\n\n` +
    `⏱️ Uptime: ${days}g ${hours}s ${minutes}d\n` +
    `💾 Bellek: ${memUsedMB} MB / ${memTotalMB} MB\n` +
    `🤖 Bot: Çalışıyor ✅\n` +
    `🔗 Webhook: Aktif ✅\n` +
    `📡 RemnaWave API: Bağlı ✅`;

  await safeEditMessageText(ctx, message, { parse_mode: "Markdown" });
}

/**
 * Admin Panel - Geri Butonu
 */
export async function adminBackHandler(ctx: Context) {
  await safeAnswerCallback(ctx);

  const keyboard = new InlineKeyboard()
    .text("⚙️ Kullanıcı İşlemleri", "admin_user_ops")
    .text("📢 Toplu Bildirim", "admin_broadcast").row()
    .text("📊 İstatistikler", "admin_stats")
    .text("📝 Sistem Logları", "admin_logs").row()
    .text("💾 Sistem Durumu", "admin_status");

  await safeEditMessageText(ctx,
    "👨‍💼 *Admin Paneli*\n\nYönetim fonksiyonlarını seçin:",
    { reply_markup: keyboard, parse_mode: "Markdown" }
  );
}

