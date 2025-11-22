import "dotenv/config";
import { Bot, Context, InlineKeyboard } from "grammy";
import axios from "axios";
const YAML = require("yamljs");
import path from "path";
import fs from "fs";
import { createUser, getUserByTelegramId, getInternalSquads, getUserByUsername, getUserHwidDevices, deleteUserHwidDevice, getAllUsers } from "./api";
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import crypto from 'crypto';

// --- EXPRESS API SETUP ---
const app = express();
const port = process.env.PORT || 3000;

// API Configuration
const API_BASE_URL = process.env.API_BASE_URL || "";
const API_TOKEN = process.env.API_TOKEN || "";

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
export const bot = new Bot<Context>(process.env.BOT_TOKEN || "");

// Error handler - Grammy hatalarını yakala
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;

  if (e instanceof Error) {
    console.error("Error name:", e.name);
    console.error("Error message:", e.message);

    // Callback query timeout hatası - normal, atla
    if (e.message.includes("query is too old")) {
      console.warn("⚠️ Callback query timeout (normal, ignored)");
      return;
    }

    // Bot blocked hatası - kullanıcı botu engellemiş
    if (e.message.includes("bot was blocked")) {
      console.warn("⚠️ User blocked the bot");
      return;
    }
  }

  console.error("Full error:", e);
});

// Admin session management - kullanıcının beklenen aksiyonunu takip et
interface AdminSession {
  action: 'search' | 'broadcast' | 'extend_days' | 'add_traffic' | null;
  targetUser?: string;
}

const adminSessions = new Map<number, AdminSession>();

// Helper: Safe callback query answer (timeout hatalarını yakala)
async function safeAnswerCallback(ctx: any, text?: string) {
  try {
    if (text) {
      await ctx.answerCallbackQuery(text);
    } else {
      await ctx.answerCallbackQuery();
    }
  } catch (e: any) {
    // Timeout hatası - normal, logla ve devam et
    if (e.message?.includes("query is too old") || e.message?.includes("query ID is invalid")) {
      console.warn("⚠️ Callback query timeout (ignored)");
      return;
    }
    // Diğer hatalar
    console.error("❌ answerCallbackQuery error:", e.message);
  }
}

// Middleware: Tüm gelen mesajları logla (DEBUG)
bot.use(async (ctx, next) => {
  if (ctx.message?.text) {
    console.log(`📥 Mesaj alındı: "${ctx.message.text}" (user: ${ctx.from?.id})`);
  }
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
    if (adminSessions.has(userId)) {
      adminSessions.delete(userId);
      await ctx.reply("❌ İşlem iptal edildi.");
      return;
    }
  }

  const session = adminSessions.get(userId);

  if (!session || !session.action) {
    return next(); // Normal komut işlemeye devam et
  }

  // Admin session varsa işle
  try {
    if (session.action === 'search') {
      // Kullanıcı arama
      const username = text.trim();

      try {
        const user = await getUserByUsername(username);

        if (!user) {
          await ctx.reply(`❌ Kullanıcı bulunamadı: ${username}`);
          adminSessions.delete(userId);
          return;
        }

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

        await ctx.reply(message, { parse_mode: "Markdown" });
        adminSessions.delete(userId);

      } catch (e: any) {
        await ctx.reply(`❌ Hata: ${e?.message || 'Bilinmeyen hata'}`);
        adminSessions.delete(userId);
      }

    } else if (session.action === 'broadcast') {
      // Toplu bildirim gönder
      const message = text;

      await ctx.reply("📤 Toplu bildirim gönderiliyor...");

      try {
        console.log('Admin: Toplu bildirim başlatılıyor');
        const users = await getAllUsers(1, 1000); // Tüm kullanıcılar
        console.log(`Admin: ${users.length} kullanıcı bulundu`);

        // Debug: İlk kullanıcının tüm field'larını göster
        if (users.length > 0) {
          console.log('Admin: İlk kullanıcı örneği:', JSON.stringify(users[0], null, 2));
        }

        // telegramId veya telegram_id olabilir - her ikisini kontrol et
        const usersWithTelegram = users.filter((u: any) => {
          const hasId = u.telegramId || u.telegram_id || u.tId;
          if (hasId) {
            console.log(`User ${u.username}: telegramId=${u.telegramId}, telegram_id=${u.telegram_id}, tId=${u.tId}`);
          }
          return hasId;
        });
        console.log(`Admin: ${usersWithTelegram.length} kullanıcının Telegram ID'si var`);

        let sent = 0;
        let failed = 0;

        for (const user of usersWithTelegram) {
          try {
            const telegramId = user.telegramId || user.telegram_id || user.tId;
            console.log(`Admin: Mesaj gönderiliyor -> ${user.username} (${telegramId})`);
            await bot.api.sendMessage(telegramId, message);
            sent++;
            await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit
          } catch (e: any) {
            console.warn(`Broadcast failed for user ${user.username}:`, e?.message || e);
            failed++;
          }
        }

        await ctx.reply(
          `✅ Toplu bildirim tamamlandı!\n\n` +
          `📤 Gönderilen: ${sent}\n` +
          `❌ Başarısız: ${failed}\n` +
          `👥 Toplam: ${usersWithTelegram.length}`
        );

        adminSessions.delete(userId);

      } catch (e: any) {
        await ctx.reply(`❌ Hata: ${e?.message || 'Bilinmeyen hata'}`);
        adminSessions.delete(userId);
      }
    }
  } catch (e: any) {
    console.error('Admin session error:', e);
    await ctx.reply(`❌ İşlem sırasında hata oluştu: ${e?.message}`);
    adminSessions.delete(userId);
  }
});

// OpenAPI YAML dosyasını yükle
let openApiDocument: any;
const openApiFilePath = "./openapi.yaml";

try {
  const yamlContent = fs.readFileSync(openApiFilePath, "utf8");
  openApiDocument = YAML.parse(yamlContent);
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
  console.log('✅ /start komutu alındı - çalışıyor!');
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

// Test komutu - bot mesaj alıyor mu kontrol için
bot.command("ping", async (ctx) => {
  console.log('🏓 /ping komutu alındı!');
  await ctx.reply("🏓 Pong! Bot çalışıyor.");
});

// Admin Panel Komutları
bot.command("admin", async (ctx) => {
  console.log('🔴 /admin komutu tetiklendi - EN BAŞTA');

  try {
    const telegramId = ctx.from?.id;

    console.log('🔍 /admin komutu çalıştırıldı');
    console.log('   Telegram ID:', telegramId);
    console.log('   Username:', ctx.from?.username);
    console.log('   First name:', ctx.from?.first_name);

    const envValue = process.env.ADMIN_TELEGRAM_IDS;
    console.log('   ADMIN_TELEGRAM_IDS env RAW:', envValue);
    console.log('   ADMIN_TELEGRAM_IDS type:', typeof envValue);

    // Basit kontrol - direkt string olarak karşılaştır
    const adminIdsString = envValue || '';
    const adminIdsArray = adminIdsString.split(',').map(id => id.trim());
    const telegramIdString = String(telegramId);

    console.log('   Admin IDs (string array):', adminIdsArray);
    console.log('   User Telegram ID (string):', telegramIdString);
    console.log('   Array includes check:', adminIdsArray.includes(telegramIdString));

    // Hem string hem number kontrolü
    const isAdminString = adminIdsArray.includes(telegramIdString);
    const isAdminNumber = adminIdsArray.map(id => parseInt(id)).includes(telegramId || 0);

    console.log('   Is admin (string check)?', isAdminString);
    console.log('   Is admin (number check)?', isAdminNumber);

    const isAdmin = isAdminString || isAdminNumber;

    if (!isAdmin) {
      console.log('   ❌ Yetki yok - mesaj gönderiliyor');
      await ctx.reply("⛔ Bu komutu kullanma yetkiniz yok.");
      return;
    }

    console.log('   ✅ Admin yetkisi var - panel açılıyor');

    const keyboard = new InlineKeyboard()
      .text("👥 Kullanıcı Listesi", "admin_users")
      .text("🔍 Kullanıcı Ara", "admin_search").row()
      .text("📢 Toplu Bildirim", "admin_broadcast")
      .text("📊 İstatistikler", "admin_stats").row()
      .text("⚙️ Kullanıcı İşlemleri", "admin_user_ops")
      .text("📝 Sistem Logları", "admin_logs").row()
      .text("💾 Sistem Durumu", "admin_status");

    await ctx.reply(
      "👨‍💼 *Admin Paneli*\n\nYönetim fonksiyonlarını seçin:",
      { reply_markup: keyboard, parse_mode: "Markdown" }
    );

    console.log('   ✅ Admin paneli mesajı gönderildi');
  } catch (error: any) {
    console.error('❌ /admin komutunda HATA:', error.message);
    console.error('   Stack:', error.stack);
    try {
      await ctx.reply(`❌ Hata oluştu: ${error.message}`);
    } catch (e) {
      console.error('   Hata mesajı da gönderilemedi:', e);
    }
  }
});

// Admin Panel - Kullanıcı Listesi
bot.callbackQuery("admin_users", async (ctx) => {
  await safeAnswerCallback(ctx);

  try {
    console.log('Admin: Kullanıcı listesi istendi');
    const users = await getAllUsers(1, 10);
    console.log(`Admin: ${users.length} kullanıcı bulundu`);

    if (!users || users.length === 0) {
      await ctx.editMessageText("ℹ️ Sistemde henüz kullanıcı bulunmuyor.");
      return;
    }

    let message = "👥 *Kullanıcı Listesi* (İlk 10)\n\n";

    users.forEach((user: any, index: number) => {
      const status = user.status === 'ACTIVE' ? '🟢' :
                     user.status === 'LIMITED' ? '🟡' :
                     user.status === 'EXPIRED' ? '🔴' : '⚫';
      const usedGB = (user.usedTrafficBytes / 1024 / 1024 / 1024).toFixed(2);
      const limitGB = (user.trafficLimitBytes / 1024 / 1024 / 1024).toFixed(0);
      message += `${index + 1}. ${status} ${user.username}\n`;
      message += `   📊 ${usedGB} GB / ${limitGB} GB\n`;
    });

    await ctx.editMessageText(message, { parse_mode: "Markdown" });
  } catch (e: any) {
    console.error('Admin: Kullanıcı listesi hatası:', e.message);
    await ctx.editMessageText(`❌ Hata: ${e?.message || 'Kullanıcı listesi alınamadı'}`);
  }
});

// Admin Panel - Kullanıcı Arama
bot.callbackQuery("admin_search", async (ctx) => {
  await safeAnswerCallback(ctx);

  const adminId = ctx.from?.id;
  if (adminId) {
    adminSessions.set(adminId, { action: 'search' });
  }

  await ctx.editMessageText(
    "🔍 *Kullanıcı Arama*\n\nKullanıcı adını yazın:",
    { parse_mode: "Markdown" }
  );
});

// Admin Panel - Toplu Bildirim
bot.callbackQuery("admin_broadcast", async (ctx) => {
  await safeAnswerCallback(ctx);

  const adminId = ctx.from?.id;
  if (adminId) {
    adminSessions.set(adminId, { action: 'broadcast' });
  }

  await ctx.editMessageText(
    "📢 *Toplu Bildirim*\n\nGöndermek istediğiniz mesajı yazın:\n\n_İptal için /cancel yazın_",
    { parse_mode: "Markdown" }
  );
});

// Admin Panel - İstatistikler
bot.callbackQuery("admin_stats", async (ctx) => {
  await safeAnswerCallback(ctx);

  try {
    console.log('Admin: İstatistikler istendi');
    const users = await getAllUsers(1, 1000); // Tüm kullanıcılar
    console.log(`Admin: ${users.length} kullanıcı için istatistik hesaplanıyor`);

    const total = users.length;
    const active = users.filter((u: any) => u.status === 'ACTIVE').length;
    const limited = users.filter((u: any) => u.status === 'LIMITED').length;
    const expired = users.filter((u: any) => u.status === 'EXPIRED').length;

    const totalTraffic = users.reduce((sum: number, u: any) => sum + (parseInt(u.usedTrafficBytes) || 0), 0);
    const avgTraffic = total > 0 ? totalTraffic / total : 0;

    const message = `📊 *Sistem İstatistikleri*\n\n` +
      `👥 Toplam Kullanıcı: ${total}\n` +
      `🟢 Aktif: ${active}\n` +
      `🟡 Limitli: ${limited}\n` +
      `🔴 Süresi Dolmuş: ${expired}\n\n` +
      `📈 Toplam Trafik: ${(totalTraffic / 1024 / 1024 / 1024).toFixed(2)} GB\n` +
      `📊 Ortalama Trafik: ${(avgTraffic / 1024 / 1024 / 1024).toFixed(2)} GB/kullanıcı`;

    await ctx.editMessageText(message, { parse_mode: "Markdown" });
  } catch (e: any) {
    console.error('Admin: İstatistik hatası:', e.message);
    await ctx.editMessageText(`❌ Hata: ${e?.message || 'İstatistikler alınamadı'}`);
  }
});

// Admin Panel - Kullanıcı İşlemleri
bot.callbackQuery("admin_user_ops", async (ctx) => {
  await safeAnswerCallback(ctx);

  const keyboard = new InlineKeyboard()
    .text("✅ Kullanıcı Aktifleştir", "admin_activate")
    .text("⛔ Kullanıcı Pasifleştir", "admin_deactivate").row()
    .text("⏰ Süre Uzat", "admin_extend")
    .text("📊 Trafik Ekle", "admin_add_traffic").row()
    .text("🔙 Geri", "admin_back");

  await ctx.editMessageText(
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

  await ctx.editMessageText(message, { parse_mode: "Markdown" });
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

  await ctx.editMessageText(message, { parse_mode: "Markdown" });
});

// Admin Panel - Geri butonu
bot.callbackQuery("admin_back", async (ctx) => {
  await safeAnswerCallback(ctx);

  const keyboard = new InlineKeyboard()
    .text("👥 Kullanıcı Listesi", "admin_users")
    .text("🔍 Kullanıcı Ara", "admin_search").row()
    .text("📢 Toplu Bildirim", "admin_broadcast")
    .text("📊 İstatistikler", "admin_stats").row()
    .text("⚙️ Kullanıcı İşlemleri", "admin_user_ops")
    .text("📝 Sistem Logları", "admin_logs").row()
    .text("💾 Sistem Durumu", "admin_status");

  await ctx.editMessageText(
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
