import "dotenv/config";
import { Bot, Context, InlineKeyboard } from "grammy";
import * as yaml from "js-yaml";
import fs from "fs";
import { createUser, getUserByTelegramId, getInternalSquads, getUserByUsername, getUserHwidDevices, deleteUserHwidDevice, getAllUsers } from "./api";
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import crypto from 'crypto';

// 🎯 NEW: Import modern architecture layers
import { env } from './config/env';
import { errorHandler, safeAnswerCallback, safeEditMessageText } from './middlewares/error.middleware';
import { sessionManager } from './middlewares/session.middleware';
import { adminAuthMiddleware, isAdmin } from './middlewares/auth.middleware';
import { userService } from './services/user.service';
import { notificationService } from './services/notification.service';
import { logger } from './utils/logger';

// --- EXPRESS API SETUP ---
const app = express();
const port = env.PORT;

// API Configuration (still used by legacy code)
const API_BASE_URL = env.API_BASE_URL;
const API_TOKEN = env.API_TOKEN;

app.use(cors()); // Frontend'den gelen isteklere izin ver
app.use(express.json());

// Health check endpoint for deployments/load balancers
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Telegram'dan gelen veriyi doğrulamak için middleware
const verifyTelegramWebAppData = (req: Request, res: Response, next: NextFunction) => {
  const initData = req.headers['x-telegram-init-data'] as string;
  const botToken = process.env.BOT_TOKEN;

  if (!initData || !botToken) {
    return res.status(401).json({ error: 'Not authorized.' });
  }

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (calculatedHash === hash) {
    // Doğrulama başarılı, user verisini req objesine ekle
    const userParam = params.get('user');
    if (userParam) {
      (req as any).telegramUser = JSON.parse(userParam);
    }
    return next();
  }

  return res.status(403).json({ error: 'Invalid hash.' });
};

// Mini App için hesap bilgisi endpoint'i
app.get('/api/account', verifyTelegramWebAppData, async (req: Request, res: Response) => {
  try {
    const telegramUser = (req as any).telegramUser;

    if (!telegramUser || !telegramUser.id) {
      return res.status(400).json({ error: 'User data not found in Telegram initData' });
    }

    const telegramId = telegramUser.id;

    const user = await getUserByTelegramId(telegramId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch HWID devices for this user
    const hwidData = await getUserHwidDevices(user.uuid);

    // Attach HWID data to user object
    const userWithHwid = {
      ...user,
      hwid: hwidData,
    };

    console.log('User object sent to frontend:', userWithHwid); // Frontend'e gönderilen user objesini logla
    res.json(userWithHwid);
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// --- GRAMMY BOT SETUP ---
export const bot = new Bot<Context>(env.BOT_TOKEN);

// 🎯 NEW: Use error handler middleware
bot.catch(errorHandler);

// 🗑️ DELETED: Old adminSessions Map - now using sessionManager
// interface AdminSession { ... }
// const adminSessions = new Map<number, AdminSession>();

// 🗑️ DELETED: Old safeAnswerCallback - now imported from middleware
// async function safeAnswerCallback(ctx: any, text?: string) { ... }

// Middleware: Sadece hata durumlarını logla
bot.use(async (ctx, next) => {
  await next();
});

// Admin mesaj handler - session tabanlı işlemler
bot.on("message:text", async (ctx, next) => {
  const userId = ctx.from?.id;
  const text = ctx.message.text;

  if (!userId || !text) {
    return next();
  }

  // Cancel komutu
  if (text === '/cancel') {
    if (sessionManager.has(userId)) {
      sessionManager.delete(userId);
      await ctx.reply("❌ İşlem iptal edildi.");
      return;
    }
  }

  const session = sessionManager.get(userId);

  if (!session || !session.action) {
    return next(); // Normal komut işlemeye devam et
  }

  // Admin session varsa işle
  try {
    // Eğer kullanıcı bir komut girdiyse (/app, /start vb.), session'ı iptal et ve devam et
    if (text.startsWith('/')) {
      sessionManager.delete(userId);
      return next();
    }

    if (session.action === 'search') {
      const query = text.trim();

      try {
        const results = await userService.searchUsers(query);

        if (results.length === 0) {
          await ctx.reply(`❌ Kullanıcı bulunamadı: ${query}`);
          sessionManager.delete(userId);
          return;
        }

        if (results.length === 1) {
          const user = results[0];
          const message = await userService.getUserDetailsMessage(user.username);

          // Kullanıcı detayına gitmek için buton ekle
          const keyboard = new InlineKeyboard()
            .text("⏰ Süre Uzat", `admin_extend_${user.username}`)
            .text("📊 Trafik Ekle", `admin_add_traffic_${user.username}`).row()
            .text("🔄 Cihaz Sıfırla", `admin_reset_devices_${user.username}`).row()
            .text("🔙 Kullanıcı Listesi", "users");

          await ctx.reply(message, { parse_mode: "Markdown", reply_markup: keyboard });
        } else {
          // Birden fazla sonuç varsa listele
          const message = `🔍 *Arama Sonuçları* (${results.length})\n\nLütfen bir kullanıcı seçin:`;
          const keyboard = new InlineKeyboard();

          results.slice(0, 10).forEach((user: any) => {
            const status = user.status === 'ACTIVE' ? '🟢' :
                           user.status === 'LIMITED' ? '🟡' :
                           user.status === 'EXPIRED' ? '🔴' : '⚫';
            keyboard.text(`${status} ${user.username}`, `u_d_${user.username}`).row();
          });

          keyboard.text("🔙 İptal", "admin_user_ops");

          await ctx.reply(message, { parse_mode: "Markdown", reply_markup: keyboard });
        }
        
        sessionManager.delete(userId);

      } catch (e: any) {
        await ctx.reply(`❌ Hata: ${e?.message || 'Kullanıcı bulunamadı'}`);
        sessionManager.delete(userId);
      }

    } else if (session.action === 'broadcast') {
      const message = text;

      await ctx.reply("📤 Toplu bildirim gönderiliyor...");

      try {
        const result = await notificationService.broadcast(message);

        await ctx.reply(
          `✅ Toplu bildirim tamamlandı!\n\n` +
          `📤 Gönderilen: ${result.sent}\n` +
          `❌ Başarısız: ${result.failed}\n` +
          `👥 Toplam: ${result.sent + result.failed}`
        );

        sessionManager.delete(userId);

      } catch (e: any) {
        logger.error('Broadcast error:', e.message);
        await ctx.reply(`❌ Hata: ${e?.message || 'Bilinmeyen hata'}`);
        sessionManager.delete(userId);
      }
    } else if (session.action === 'extend_days') {
      const days = parseInt(text);
      const username = session.targetUser;

      if (isNaN(days) || days <= 0) {
        await ctx.reply("❌ Lütfen geçerli bir gün sayısı girin (Örn: 30).");
        return;
      }

      if (!username) {
        await ctx.reply("❌ Hedef kullanıcı bulunamadı.");
        sessionManager.delete(userId);
        return;
      }

      try {
        await ctx.reply("⏳ İşlem yapılıyor...");
        const updatedUser = await userService.extendTime(username, days);
        
        const newDate = new Date(updatedUser.expireAt).toLocaleDateString('tr-TR');
        await ctx.reply(`✅ *${username}* kullanıcısının süresi *${days} gün* uzatıldı.\n📅 Yeni Bitiş: ${newDate}`, { parse_mode: "Markdown" });
        
        sessionManager.delete(userId);
      } catch (e: any) {
        await ctx.reply(`❌ Hata: ${e?.message || 'Süre uzatılamadı'}`);
        sessionManager.delete(userId);
      }

    } else if (session.action === 'add_traffic') {
      const gb = parseFloat(text);
      const username = session.targetUser;

      if (isNaN(gb) || gb <= 0) {
        await ctx.reply("❌ Lütfen geçerli bir GB miktarı girin (Örn: 10).");
        return;
      }

      if (!username) {
        await ctx.reply("❌ Hedef kullanıcı bulunamadı.");
        sessionManager.delete(userId);
        return;
      }

      try {
        await ctx.reply("⏳ İşlem yapılıyor...");
        const updatedUser = await userService.addTraffic(username, gb);
        
        const limitGB = (updatedUser.trafficLimitBytes / 1024 / 1024 / 1024).toFixed(0);
        await ctx.reply(`✅ *${username}* kullanıcısına *${gb} GB* trafik eklendi.\n📊 Yeni Limit: ${limitGB} GB`, { parse_mode: "Markdown" });
        
        sessionManager.delete(userId);
      } catch (e: any) {
        await ctx.reply(`❌ Hata: ${e?.message || 'Trafik eklenemedi'}`);
        sessionManager.delete(userId);
      }
    }
  } catch (e: any) {
    console.error('Admin session error:', e);
    await ctx.reply(`❌ İşlem sırasında hata oluştu: ${e?.message}`);
    sessionManager.delete(userId);
  }
});

// OpenAPI YAML dosyasını yükle
let openApiDocument: any;
const openApiFilePath = "./openapi.yaml";

try {
  const yamlContent = fs.readFileSync(openApiFilePath, "utf8");
  openApiDocument = yaml.load(yamlContent);
  console.log("OpenAPI document loaded.");
} catch (error) {
  console.error("Error loading OpenAPI document:", error);
}

// MINI_APP_URL'i burada al
const miniAppUrl = process.env.MINI_APP_URL || "";

// Public base URL (for deeplink redirects). If not provided, derive from incoming request.
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "";

// Validate configuration against remote API at startup
async function validateConfigAtStartup() {
  const squadUuid = process.env.INTERNAL_SQUAD_UUID;
  if (!squadUuid) {
    console.warn("INTERNAL_SQUAD_UUID is not set. Trial creation may fail.");
    return;
  }
  try {
    const squads = await getInternalSquads();
    const found = Array.isArray(squads) && squads.find((s: any) => s?.uuid === squadUuid);
    if (!found) {
      const available = Array.isArray(squads) ? squads.map((s: any) => s?.uuid).filter(Boolean).join(", ") : "<unavailable>";
      console.error(`Configured INTERNAL_SQUAD_UUID not found on API: ${squadUuid}. Available squads: ${available}`);
    } else {
      console.log(`Validated internal squad: ${found.name || found.uuid}`);
    }
  } catch (e: any) {
    console.error("Failed to validate INTERNAL_SQUAD_UUID:", e?.message || e);
  }
}

// Başlangıç komutu için klavye oluştur
const startKeyboard = new InlineKeyboard()
  .text("🚀 Try for Free", "try_free")
  .text("💳 Satın Al", "buy_subscription")
  .row()
  .text("👤 Hesabım", "my_account")
  .webApp("📱 Mini App", miniAppUrl); // Doğrudan webApp butonu kullan

// /start komutuna yanıt ver
bot.command("start", async (ctx) => {
  const welcomeMessage = `
Hoş geldiniz! Bu bot ile VPN hizmetinize erişebilirsiniz.

Lütfen aşağıdaki seçeneklerden birini seçin:
`;
  await ctx.reply(welcomeMessage, {
    reply_markup: startKeyboard,
  });
});

// Basit deeplink redirect sayfası (https -> happ://)
app.get('/redirect', (req: Request, res: Response) => {
  const to = req.query.to as string | undefined;
  const fallback = (req.query.fallback as string | undefined) || 'https://t.me/';
  if (!to) {
    return res.status(400).send('Missing to parameter');
  }
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Açılıyor…</title></head><body style="font-family:system-ui;padding:24px;background:#111;color:#eee"><h2>Uygulamada açılıyor…</h2><p>Eğer otomatik açılmazsa <a id="open">buraya dokunun</a>.</p><script>const to=decodeURIComponent(${JSON.stringify(encodeURIComponent(to))});const fb=decodeURIComponent(${JSON.stringify(encodeURIComponent(fallback))});function open(){window.location.href=to;}document.getElementById('open').setAttribute('href',to);open();setTimeout(()=>{if(document.hidden)return;window.location.href=fb;},1500);</script></body></html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// Mini App'ten Happ deeplink'i Telegram sohbetine gönderen köprü endpoint
app.post('/api/happ/open', verifyTelegramWebAppData, async (req: Request, res: Response) => {
  try {
    const telegramUser = (req as any).telegramUser;
    const chatId = telegramUser?.id;
    if (!chatId) {
      return res.status(400).json({ error: 'Telegram user id not found' });
    }

    const user = await getUserByTelegramId(chatId);
    const link: string | undefined = user?.happ?.cryptoLink;
    if (!link) {
      return res.status(404).json({ error: 'CryptoLink not found for user' });
    }

    // Redirect URL (https), constructing absolute base URL
    const proto = (req.headers['x-forwarded-proto'] as string) || (PUBLIC_BASE_URL.startsWith('https') ? 'https' : 'http');
    const hostFromHeader = req.headers['x-forwarded-host'] || req.headers.host;
    const base = PUBLIC_BASE_URL || `${proto}://${hostFromHeader}`;
    const iosStore = 'https://apps.apple.com/us/app/happ-proxy-utility/id6504287215';
    const androidStore = 'https://play.google.com/store/apps/details?id=com.happproxy';
    const fallback = iosStore; // tek fallback bırakıyoruz
    const redirectUrl = `${base}/redirect?to=${encodeURIComponent(link)}&fallback=${encodeURIComponent(fallback)}`;

    const kb = new InlineKeyboard().url("Happ’ta Aç", redirectUrl);
    await bot.api.sendMessage(chatId, "Happ uygulamasında açmak için aşağıdaki butona dokunun:", { reply_markup: kb });

    res.json({ ok: true });
  } catch (error: any) {
    console.error('Failed to send Happ deeplink:', error?.message || error);
    res.status(500).json({ error: 'Failed to send deeplink' });
  }
});

// HWID cihazı silme endpoint
app.delete('/api/hwid/device', verifyTelegramWebAppData, async (req: Request, res: Response) => {
  try {
    const telegramUser = (req as any).telegramUser;
    const chatId = telegramUser?.id;
    if (!chatId) {
      return res.status(400).json({ error: 'Telegram user id not found' });
    }

    const { hwid } = req.body;
    if (!hwid) {
      return res.status(400).json({ error: 'HWID parameter is required' });
    }

    const user = await getUserByTelegramId(chatId);
    if (!user || !user.uuid) {
      return res.status(404).json({ error: 'User not found' });
    }

    await deleteUserHwidDevice(user.uuid, hwid);
    res.json({ ok: true, message: 'Cihaz başarıyla silindi' });
  } catch (error: any) {
    console.error('Failed to delete HWID device:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Cihaz silinemedi' });
  }
});

// Mini App'i açacak komut
bot.command("app", async (ctx) => {
  const miniAppUrl = process.env.MINI_APP_URL;
  if (!miniAppUrl) {
    return ctx.reply("Mini App URL'i ayarlanmamış. Lütfen yöneticinizle iletişime geçin.");
  }
  await ctx.reply("Aşağıdaki düğmeye tıklayarak Mini App'i açabilirsiniz:", {
    reply_markup: new InlineKeyboard().webApp("📱 Uygulamayı Aç", miniAppUrl),
  });
});

// Mini App'ten gelen verileri dinlemek için daha güvenli bir yöntem
// NOT: Bu handler tüm mesajları yakalamamalı, sadece web_app_data olanları
bot.on("message:web_app_data", async (ctx) => {
  try {
    const data = JSON.parse(ctx.message.web_app_data.data);
    if (data.command === 'try_free') {
      await handleTryFree(ctx);
    }
  } catch (error) {
    console.error("Error processing web_app_data", error);
  }
});

bot.command("help", (ctx) => ctx.reply("Size nasıl yardımcı olabilirim?"));

// Admin Panel Komutları
bot.command("admin", async (ctx) => {
  try {
    const telegramId = ctx.from?.id;

    // Admin kontrolü
    const adminIdsString = process.env.ADMIN_TELEGRAM_IDS || '';
    const adminIdsArray = adminIdsString.split(',').map(id => id.trim());
    const telegramIdString = String(telegramId);

    // String ve number kontrolü
    const isAdmin = adminIdsArray.includes(telegramIdString) ||
                    adminIdsArray.map(id => parseInt(id)).includes(telegramId || 0);

    if (!isAdmin) {
      await ctx.reply("⛔ Bu komutu kullanma yetkiniz yok.");
      return;
    }

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
    console.error('❌ /admin error:', error.message);
    try {
      await ctx.reply(`❌ Hata oluştu: ${error.message}`);
    } catch (e) {
      console.error('Failed to send error message:', e);
    }
  }
});

// Admin Panel - Kullanıcı Listesi
bot.callbackQuery(/^users(_p_(\d+))?(_s_(\w+))?(_f_(\w+))?$/, async (ctx) => {
  await safeAnswerCallback(ctx);

  const page = ctx.match && ctx.match[2] ? parseInt(ctx.match[2]) : 1;
  const sort = (ctx.match && ctx.match[4] ? ctx.match[4] : undefined) as 'traffic' | 'date' | 'status' | undefined;
  const filter = (ctx.match && ctx.match[6] ? ctx.match[6] : 'ALL');
  const limit = 10;

  try {
    const { users, total } = await userService.getUsers(page, limit, sort, filter);

    if (!users || (users.length === 0 && filter === 'ALL')) {
      await safeEditMessageText(ctx, "ℹ️ Sistemde henüz kullanıcı bulunmuyor.");
      return;
    }

    const totalPages = Math.ceil(total / limit);
    const sortLabel = sort === 'traffic' ? ' (Trafik)' : sort === 'date' ? ' (Tarih)' : sort === 'status' ? ' (Durum)' : '';
    const filterLabel = filter !== 'ALL' ? ` [${filter}]` : '';
    const message = `👥 *Kullanıcı Listesi*${sortLabel}${filterLabel} (Sayfa ${page}/${totalPages})`;

    const keyboard = new InlineKeyboard();

    const sortParam = sort ? `_s_${sort}` : '';
    const filterParam = filter ? `_f_${filter}` : '';

    // Filtreleme Butonları
    keyboard
      .text(filter === 'ALL' ? "✅ Tümü" : "Tümü", `users_p_1${sortParam}_f_ALL`)
      .text(filter === 'ACTIVE' ? "✅ Aktif" : "Aktif", `users_p_1${sortParam}_f_ACTIVE`)
      .text(filter === 'EXPIRED' ? "✅ Bitti" : "Bitti", `users_p_1${sortParam}_f_EXPIRED`)
      .row();

    // Sıralama Butonları
    keyboard
      .text(sort === 'traffic' ? "✅ Trafik" : "Trafik", `users_p_1_s_traffic${filterParam}`)
      .text(sort === 'date' ? "✅ Tarih" : "Tarih", `users_p_1_s_date${filterParam}`)
      .text(sort === 'status' ? "✅ Durum" : "Durum", `users_p_1_s_status${filterParam}`)
      .row();

    if (users.length === 0) {
       keyboard.row().text("⚠️ Bu filtrede kullanıcı yok", "noop");
    } else {
      users.forEach((user: any) => {
        const status = user.status === 'ACTIVE' ? '🟢' :
                       user.status === 'LIMITED' ? '🟡' :
                       user.status === 'EXPIRED' ? '🔴' : '⚫';
        const usedGB = (user.usedTrafficBytes / 1024 / 1024 / 1024).toFixed(1);
        const limitGB = (user.trafficLimitBytes / 1024 / 1024 / 1024).toFixed(0);

        keyboard.text(
          `${status} ${user.username} | ${usedGB}/${limitGB} GB`, 
          `u_d_${user.username}`
        ).row();
      });
    }

    // Pagination buttons
    const paginationRow = [];
    if (page > 1) {
      paginationRow.push({ text: "⬅️ Önceki", callback_data: `users_p_${page - 1}${sortParam}${filterParam}` });
    }
    if (page < totalPages) {
      paginationRow.push({ text: "Sonraki ➡️", callback_data: `users_p_${page + 1}${sortParam}${filterParam}` });
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
});

// Admin Panel - Kullanıcı Arama
bot.callbackQuery("admin_search", async (ctx) => {
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
});

// Admin Panel - Kullanıcı Detayı (tıklanabilir listeden)
bot.callbackQuery(/^u_d_(.+)$/, async (ctx) => {
  await safeAnswerCallback(ctx);

  const match = ctx.match;
  if (!match) return;

  // Aktif session varsa temizle (örn: süre uzatma veya trafik ekleme iptali)
  const adminId = ctx.from?.id;
  if (adminId && sessionManager.has(adminId)) {
    sessionManager.delete(adminId);
  }

  const username = match[1];

  try {
    const message = await userService.getUserDetailsMessage(username);

    const keyboard = new InlineKeyboard()
      .text("⏰ Süre Uzat", `admin_extend_${username}`)
      .text("📊 Trafik Ekle", `admin_add_traffic_${username}`).row()
      .text("🔄 Cihaz Sıfırla", `admin_reset_devices_${username}`).row()
      .text("🔙 Kullanıcı Listesi", "users");

    await safeEditMessageText(ctx, message, {
      parse_mode: "Markdown",
      reply_markup: keyboard
    });
  } catch (e: any) {
    await safeEditMessageText(ctx, `❌ Hata: ${e?.message || 'Kullanıcı bilgisi alınamadı'}`);
  }
});

// Admin Panel - Süre Uzat (Seçim)
bot.callbackQuery(/^admin_extend_(.+)$/, async (ctx) => {
  await safeAnswerCallback(ctx);
  const username = ctx.match ? ctx.match[1] : null;
  if (!username) return;

  const adminId = ctx.from?.id;
  if (adminId) {
    sessionManager.set(adminId, { action: 'extend_days', targetUser: username });
  }

  const keyboard = new InlineKeyboard()
    .text("🔙 İptal", `u_d_${username}`);

  await safeEditMessageText(ctx,
    `⏰ *Süre Uzatma: ${username}*\n\nKaç gün eklemek istiyorsunuz? (Örn: 30)\n\n_İptal için aşağıdaki butona tıklayın_`,
    { parse_mode: "Markdown", reply_markup: keyboard }
  );
});

// Admin Panel - Trafik Ekle (Seçim)
bot.callbackQuery(/^admin_add_traffic_(.+)$/, async (ctx) => {
  await safeAnswerCallback(ctx);
  const username = ctx.match ? ctx.match[1] : null;
  if (!username) return;

  const adminId = ctx.from?.id;
  if (adminId) {
    sessionManager.set(adminId, { action: 'add_traffic', targetUser: username });
  }

  const keyboard = new InlineKeyboard()
    .text("🔙 İptal", `u_d_${username}`);

  await safeEditMessageText(ctx,
    `📊 *Trafik Ekleme: ${username}*\n\nKaç GB eklemek istiyorsunuz? (Örn: 10)\n\n_İptal için aşağıdaki butona tıklayın_`,
    { parse_mode: "Markdown", reply_markup: keyboard }
  );
});

// Admin Panel - Cihaz Sıfırla (İşlem)
bot.callbackQuery(/^admin_reset_devices_(.+)$/, async (ctx) => {
  const username = ctx.match ? ctx.match[1] : null;
  if (!username) return;

  try {
    await safeAnswerCallback(ctx, "Cihazlar sıfırlanıyor...");
    
    await userService.resetDevices(username);
    
    await ctx.reply(`✅ *${username}* kullanıcısının tüm cihazları sıfırlandı!`, { parse_mode: "Markdown" });
    
    // Kullanıcı detayına geri dön
    try {
      const message = await userService.getUserDetailsMessage(username);
      const keyboard = new InlineKeyboard()
        .text("⏰ Süre Uzat", `admin_extend_${username}`)
        .text("📊 Trafik Ekle", `admin_add_traffic_${username}`).row()
        .text("🔄 Cihaz Sıfırla", `admin_reset_devices_${username}`).row()
        .text("🔙 Kullanıcı Listesi", "users");
        
      await safeEditMessageText(ctx, message, {
        parse_mode: "Markdown",
        reply_markup: keyboard
      });
    } catch (e) {
      // Detay sayfasına dönemezsek sorun değil
    }
  } catch (e: any) {
    logger.error(`Reset devices error for ${username}:`, e.message);
    await ctx.reply(`❌ Hata: ${e?.message || 'Cihazlar sıfırlanamadı'}`);
  }
});

// Admin Panel - Toplu Bildirim
bot.callbackQuery("admin_broadcast", async (ctx) => {
  await safeAnswerCallback(ctx);

  const adminId = ctx.from?.id;
  if (adminId) {
    sessionManager.set(adminId, { action: 'broadcast' });
  }

  await safeEditMessageText(ctx,
    "📢 *Toplu Bildirim*\n\nGöndermek istediğiniz mesajı yazın:\n\n_İptal için /cancel yazın_",
    { parse_mode: "Markdown" }
  );
});

// Admin Panel - İstatistikler
bot.callbackQuery("admin_stats", async (ctx) => {
  await safeAnswerCallback(ctx);

  try {
    // 🎯 NEW: Use userService.getStatistics
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
    // 🎯 NEW: Use logger
    logger.error('Admin panel error (stats):', e.message);
    await safeEditMessageText(ctx, `❌ Hata: ${e?.message || 'İstatistikler alınamadı'}`);
  }
});

// Admin Panel - Kullanıcı İşlemleri
bot.callbackQuery("admin_user_ops", async (ctx) => {
  await safeAnswerCallback(ctx);

  // Aktif session varsa temizle (kullanıcı ara veya broadcast iptal)
  const adminId = ctx.from?.id;
  if (adminId && sessionManager.has(adminId)) {
    sessionManager.delete(adminId);
  }

  const keyboard = new InlineKeyboard()
    .text("👥 Kullanıcı Listesi", "users")
    .text("🔍 Kullanıcı Ara", "admin_search").row()
    .text("🔙 Geri", "admin_back");

  await safeEditMessageText(ctx,
    "⚙️ *Kullanıcı İşlemleri*\n\nİşlem seçin:",
    { reply_markup: keyboard, parse_mode: "Markdown" }
  );
});

// Admin Panel - Sistem Durumu
bot.callbackQuery("admin_status", async (ctx) => {
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
});

// Admin Panel - Sistem Logları
bot.callbackQuery("admin_logs", async (ctx) => {
  await safeAnswerCallback(ctx);

  // Not: Production'da log dosyası okuma gerekir
  // Şimdilik basit bilgi gösterelim
  const message = `📝 *Sistem Logları*\n\n` +
    `Bu özellik geliştirme aşamasındadır.\n\n` +
    `Log'ları görmek için:\n` +
    `• Dokploy: Logs sekmesi\n` +
    `• PM2: \`pm2 logs telegram-bot\`\n` +
    `• Docker: \`docker logs -f container_name\``;

  await safeEditMessageText(ctx, message, { parse_mode: "Markdown" });
});

// Admin Panel - Geri butonu
bot.callbackQuery("admin_back", async (ctx) => {
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
});

// "Try for Free" düğmesine basıldığında (orijinal callback)
bot.callbackQuery("try_free", async (ctx) => {
  await handleTryFree(ctx);
});

// "Satın Al" düğmesine basıldığında
bot.callbackQuery("buy_subscription", async (ctx) => {
  await safeAnswerCallback(ctx, "Çok yakında!");
});

// "Hesabım" düğmesine basıldığında
bot.callbackQuery("my_account", async (ctx) => {
  const telegramId = ctx.from?.id;

  if (!telegramId) {
    await safeAnswerCallback(ctx, "Hata!");
    await ctx.reply("Telegram ID'niz alınamadı. Lütfen tekrar deneyin.");
    return;
  }

  try {
    await safeAnswerCallback(ctx, "Hesap bilgileriniz getiriliyor...");

    const user = await getUserByTelegramId(telegramId);

    if (!user) {
      await ctx.reply("Sistemde kayıtlı bir hesabınız bulunamadı. Lütfen önce 'Try for Free' seçeneği ile bir deneme hesabı oluşturun.");
      return;
    }
    const buyKeyboard = new InlineKeyboard().text("💳 Yeni Abonelik Satın Al", "buy_subscription");

    // Eğer hesap limitli veya süresi dolmuşsa, kullanıcıyı bilgilendir ve satın almaya yönlendir
    if (user.status === 'LIMITED' || user.status === 'EXPIRED') {
      let reason = user.status === 'LIMITED' ? "Trafik kotanız doldu." : "Abonelik süreniz sona erdi.";
      await ctx.reply(`
⚠️ **Hesabınız Kısıtlandı!**

${reason}

Hizmetimizi kullanmaya devam etmek için lütfen yeni bir abonelik satın alın.
      `, { reply_markup: buyKeyboard });
      return;
    }

    // Kalan süreyi hesapla
    const expireDate = new Date(user.expireAt);
    const now = new Date();
    const diffTime = expireDate.getTime() - now.getTime();
    const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Kalan kotayı GB olarak hesapla
    const trafficLimitGB = (user.trafficLimitBytes / (1024 * 1024 * 1024)).toFixed(2);
    const trafficUsedGB = (user.usedTrafficBytes / (1024 * 1024 * 1024)).toFixed(2);
    const trafficLeftGB = (Math.max(0, user.trafficLimitBytes - user.usedTrafficBytes) / (1024 * 1024 * 1024)).toFixed(2);

    // Durum için emoji ve metin belirle
    let statusText = "";
    switch (user.status) {
      case 'ACTIVE':
        statusText = "🟢 Aktif";
        break;
      case 'DISABLED':
        statusText = "🔴 Pasif";
        break;
      case 'LIMITED':
        statusText = "🟡 Limitli";
        break;
      case 'EXPIRED':
        statusText = "⚪️ Süresi Doldu";
        break;
      default:
        statusText = user.status;
    }

    // HTML'de sorun yaratabilecek karakterleri temizle
    const escapeHTML = (text: string) => text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&/g, "&amp;");

    const appDownloadKeyboard = new InlineKeyboard()
      .url("🍏 iOS", "https://apps.apple.com/us/app/happ-proxy-utility/id6504287215") // Lütfen bu linki güncelleyin
      .url("🤖 Android", "https://play.google.com/store/apps/details?id=com.happproxy"); // Lütfen bu linki güncelleyin

    const accountInfo = `
<b>🚀 VPN Hesap Detaylarınız 🚀</b>

📝 <b>Kullanıcı Adı:</b> <code>${escapeHTML(user.username)}</code>
*️⃣ <b>Abonelik Türü:</b> <code>${escapeHTML(user.tag || 'PREMIUM')}</code>
📅 <b>Bitiş Tarihi:</b> <code>${expireDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</code>
📊 <b>Kota:</b> <code>${trafficLeftGB} GB / ${trafficLimitGB} GB</code>

<b>Durum:</b> ${statusText}

<b>Happ CryptoLink:</b>
<pre><code>${escapeHTML(user.happ.cryptoLink)}</code></pre>

Uygulamanız yoksa aşağıdan indirebilirsiniz 👇
    `;

    await ctx.reply(accountInfo, { 
      parse_mode: "HTML",
      reply_markup: appDownloadKeyboard 
    });

  } catch (error: any) {
    await ctx.answerCallbackQuery("Hata!");
    await ctx.reply(`Hesap bilgileriniz alınırken bir hata oluştu: ${error.message}`);
  }
});

// "Try for Free" mantığını yeniden kullanılabilir bir fonksiyona taşıyalım
async function handleTryFree(ctx: Context) {
  const telegramId = ctx.from?.id;
  const username = ctx.from?.username;

  if (!telegramId) {
    await ctx.answerCallbackQuery?.("Hata!");
    await ctx.reply("Telegram ID'niz alınamadı. Lütfen tekrar deneyin.");
    return;
  }

  if (!username) {
    await ctx.answerCallbackQuery?.();
    await ctx.reply("Kayıt olabilmek için bir Telegram kullanıcı adınızın olması gerekmektedir.");
    return;
  }

  try {
    // Kullanıcının zaten var olup olmadığını Telegram ID ile kontrol et
    const existingUser = await getUserByTelegramId(telegramId);
    if (existingUser) {
      await ctx.answerCallbackQuery?.();
      await ctx.reply(`Bu Telegram hesabı ile zaten bir kullanıcı mevcut: <code>${existingUser.username}</code>\n\nHesap durumunuzu kontrol etmek için ana menüdeki "Hesap Durumu" düğmesini kullanabilirsiniz.`, { parse_mode: "HTML" });
      return;
    }

    await ctx.answerCallbackQuery?.("Deneme hesabınız oluşturuluyor...");

    // Kullanıcı adı çakışmalarını önlemek için benzersiz bir username üret
    let finalUsername = username;
    try {
      const existingByUsername = await getUserByUsername(username);
      if (existingByUsername) {
        const base = username.slice(0, Math.max(0, 30));
        const suffix = `-${Math.floor(1000 + Math.random() * 9000)}`;
        finalUsername = `${base}${suffix}`;
      }
    } catch (e) {
      // username kontrolü başarısızsa sessizce devam et, API zaten doğrulayacaktır
    }

    const squadUuid = process.env.INTERNAL_SQUAD_UUID;

    if (!squadUuid) {
      throw new Error("INTERNAL_SQUAD_UUID environment variable is not set");
    }

    // 3 gün sonrası için son kullanma tarihi oluştur
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + 3);

    const newUser = {
      username: finalUsername,
      telegramId,
      tag: "TRIAL", // Kullanıcıya TRIAL etiketini ekle
      expireAt: expireAt.toISOString(),
      trafficLimitBytes: 2 * 1024 * 1024 * 1024, // 2 GB
      trafficLimitStrategy: "NO_RESET",
      activeInternalSquads: [squadUuid],
    };

    // Username çakışmalarına karşı birkaç kez dene
    let createdUser: any = null;
    const baseName = finalUsername.slice(0, Math.max(0, 30));
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        createdUser = await createUser(newUser);
        break;
      } catch (err: any) {
        const msg = String(err?.message || "");
        const looksLikeUsernameConflict = msg.includes("A018") || msg.includes("409") || msg.toLowerCase().includes("username");
        if (!looksLikeUsernameConflict || attempt === 4) {
          throw err;
        }
        const suffix = `-${Math.floor(1000 + Math.random() * 9000)}`;
        finalUsername = `${baseName}${suffix}`;
        newUser.username = finalUsername;
      }
    }

    const myAccountKeyboard = new InlineKeyboard().text("👤 Hesabım", "my_account");

    await ctx.reply(`🎉 Deneme hesabınız başarıyla oluşturuldu, @${username}!\n\nHesabınız <b>3 gün</b> geçerlidir ve <b>2 GB</b> trafik limitiniz bulunmaktadır.\n\nAşağıdaki butona tıklayarak hesap detaylarınızı görebilirsiniz.`, {
      parse_mode: "HTML",
      reply_markup: myAccountKeyboard,
    });
  } catch (error: any) {
    const telegramIdForCatch = ctx.from?.id;
    const msg = String(error?.message || "");
    // A018 genellikle sunucuda mevcut hesap/benzersizlik ihlali durumunu ifade eder
    if (msg.includes("A018") && telegramIdForCatch) {
      try {
        const existing = await getUserByTelegramId(telegramIdForCatch);
        if (existing) {
          const myAccountKeyboard = new InlineKeyboard().text("👤 Hesabım", "my_account");
          await ctx.answerCallbackQuery?.();
          await ctx.reply("Bu Telegram hesabıyla zaten bir kullanıcı mevcut. Hesap detaylarını görüntülemek için aşağıdaki düğmeyi kullanın.", { reply_markup: myAccountKeyboard });
          return;
        }
      } catch {}
    }
    await ctx.answerCallbackQuery?.("Hata!");
    await ctx.reply(`Kullanıcı oluşturulurken bir hata oluştu: ${error.message}`);
  }
}

// Internal test endpoint: webhook'u manuel test etmek için (PROD: koruma gerektirir)
app.post('/internal/test-webhook/:telegramId', async (req: Request, res: Response) => {
  const token = req.headers['x-internal-token'] as string | undefined;
  const expected = process.env.INTERNAL_NOTIFY_TOKEN;
  if (!expected || token !== expected) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const telegramIdParam = req.params.telegramId;
  const reason = req.body?.reason as string | undefined;

  try {
    const user = await getUserByTelegramId(Number(telegramIdParam));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Webhook event simülasyonu
    const mockEvent = {
      event: 'user.limited',
      timestamp: new Date().toISOString(),
      data: { user }
    };

    const { handleWebhook } = await import('./webhook');
    const result = await handleWebhook(bot, mockEvent, reason);
    res.json(result);
  } catch (e: any) {
    console.error('Internal test error:', e);
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// Webhook endpoint: RemnaWave panelinden gelen olayları dinle
app.post('/endpoint', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-webhook-signature'] as string | undefined;
    const webhookSecret = process.env.WEBHOOK_SECRET;

    // Webhook secret varsa VE signature header varsa imza doğrula
    if (webhookSecret && signature) {
      const { verifyWebhookSignature } = await import('./webhook');
      const payload = JSON.stringify(req.body);
      const isValid = verifyWebhookSignature(payload, signature, webhookSecret);

      if (!isValid) {
        console.warn('⚠️ Invalid webhook signature - rejecting request');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    } else if (webhookSecret && !signature) {
      console.warn('⚠️ Webhook secret configured but no signature received');
    }

    const event = req.body;
    console.log('📡 Webhook received:', event.event);

    const { handleWebhook } = await import('./webhook');
    const result = await handleWebhook(bot, event);

    res.json({ received: true, result });
  } catch (e: any) {
    console.error('Webhook error:', e?.message || e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ...existing code...

async function startApp() {
  // Start the Express server
  app.listen(port, () => {
    console.log(`API server listening on port ${port}`);
    console.log(`Webhook endpoint: POST /endpoint (RemnaWave)`);
  });

  // Validate configuration
  await validateConfigAtStartup();

  // Start Telegram bot with long polling for commands
  // This is needed for /start, /admin and other Telegram interactions
  console.log("🤖 Starting Telegram bot (long polling)...");

  try {
    await bot.start({
      onStart: (botInfo) => {
        console.log(`✅ Bot @${botInfo.username} is running!`);
        console.log(`📱 Commands: /start, /admin, /help, /app, /ping`);
        console.log(`⚡ RemnaWave webhook: POST /endpoint`);
        console.log(`🔍 Long polling aktif - mesajları dinliyorum...`);
      },
      drop_pending_updates: true, // Eski mesajları atla
      allowed_updates: ["message", "callback_query"] // Sadece mesaj ve callback al
    });
  } catch (error: any) {
    console.error("❌ FATAL: Bot başlatılamadı!");
    console.error("Hata:", error?.message);
    console.error("Stack:", error?.stack);

    // 409 hatası özel kontrolü
    if (error?.message?.includes("409") || error?.message?.includes("Conflict")) {
      console.error("");
      console.error("🚨 409 CONFLICT HATASI TESPİT EDİLDİ!");
      console.error("Sorun: Başka bir bot instance'ı çalışıyor!");
      console.error("Çözüm 1: Dokploy'da sadece 1 instance çalıştığından emin olun");
      console.error("Çözüm 2: Local geliştirme ortamında bot çalışıyorsa durdurun");
      console.error("Çözüm 3: Başka bir sunucuda bot çalışıyorsa durdurun");
      console.error("");
    }

    console.error("Bot çalışmıyor ama API sunucusu çalışmaya devam ediyor...");
  }

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    await bot.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startApp();
