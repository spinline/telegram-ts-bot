import "dotenv/config";
import { Bot, Context, InlineKeyboard } from "grammy";
import axios from "axios";
const YAML = require("yamljs");
import path from "path";
import fs from "fs";
import { createUser, getUserByTelegramId } from "./api";
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import crypto from 'crypto';

// --- EXPRESS API SETUP ---
const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // Frontend'den gelen isteklere izin ver
app.use(express.json());

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

    console.log('User object sent to frontend:', user); // Frontend'e gönderilen user objesini logla
    res.json(user);
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// --- GRAMMY BOT SETUP ---
const bot = new Bot<Context>(process.env.BOT_TOKEN || "");

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
bot.on("message", async (ctx) => {
  // Mesajın bir "web_app_data" içerip içermediğini kontrol et
  if (ctx.message && "web_app_data" in ctx.message && ctx.message.web_app_data) {
    try {
      const data = JSON.parse(ctx.message.web_app_data.data);
      if (data.command === 'try_free') {
        await handleTryFree(ctx);
      }
    } catch (error) {
      console.error("Error processing web_app_data", error);
    }
  }
});

bot.command("help", (ctx) => ctx.reply("Size nasıl yardımcı olabilirim?"));

// "Try for Free" düğmesine basıldığında (orijinal callback)
bot.callbackQuery("try_free", async (ctx) => {
  await handleTryFree(ctx);
});

// "Satın Al" düğmesine basıldığında
bot.callbackQuery("buy_subscription", async (ctx) => {
  await ctx.answerCallbackQuery({
    text: "Çok yakında!",
    show_alert: true,
  });
});

// "Hesabım" düğmesine basıldığında
bot.callbackQuery("my_account", async (ctx) => {
  const telegramId = ctx.from?.id;

  if (!telegramId) {
    await ctx.answerCallbackQuery("Hata!");
    await ctx.reply("Telegram ID'niz alınamadı. Lütfen tekrar deneyin.");
    return;
  }

  try {
    await ctx.answerCallbackQuery("Hesap bilgileriniz getiriliyor...");

    const user = await getUserByTelegramId(telegramId);

    if (!user) {
      await ctx.reply("Sistemde kayıtlı bir hesabınız bulunamadı. Lütfen önce 'Try for Free' seçeneği ile bir deneme hesabı oluşturun.");
      return;
    }

    // Satın al butonu
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

    const squadUuid = "c1fdfa38-68bb-4648-8bba-bc18435560a3";

    // 3 gün sonrası için son kullanma tarihi oluştur
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + 3);

    const newUser = {
      username,
      telegramId,
      tag: "TRIAL", // Kullanıcıya TRIAL etiketini ekle
      expireAt: expireAt.toISOString(),
      trafficLimitBytes: 2 * 1024 * 1024 * 1024, // 2 GB
      activeInternalSquads: [squadUuid],
    };

    const createdUser = await createUser(newUser);

    const myAccountKeyboard = new InlineKeyboard().text("👤 Hesabım", "my_account");

    await ctx.reply(`🎉 Deneme hesabınız başarıyla oluşturuldu, @${username}!\n\nHesabınız <b>3 gün</b> geçerlidir ve <b>2 GB</b> trafik limitiniz bulunmaktadır.\n\nAşağıdaki butona tıklayarak hesap detaylarınızı görebilirsiniz.`, {
      parse_mode: "HTML",
      reply_markup: myAccountKeyboard,
    });
  } catch (error: any) {
    await ctx.answerCallbackQuery?.("Hata!");
    await ctx.reply(`Kullanıcı oluşturulurken bir hata oluştu: ${error.message}`);
  }
}

async function startApp() {
  // Start the Express server
  app.listen(port, () => {
    console.log(`API server listening on port ${port}`);
  });

  // Start the Telegram bot
  bot.start();
  console.log("Bot started!");
}

startApp();
