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
import {
  createVerificationSession,
  verifyOTP,
  isUserVerified,
  isUserLockedOut,
  getRemainingLockoutTime,
} from "./verificationManager";

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

// Middleware to check verification status
bot.use(async (ctx, next) => {
  const userId = ctx.from?.id;
  
  // Skip verification check for /start and /verify commands
  if (ctx.message && 'text' in ctx.message) {
    const text = ctx.message.text;
    if (text?.startsWith('/start') || text?.startsWith('/verify')) {
      return next();
    }
  }
  
  // Skip verification check for verification-related callbacks
  if (ctx.callbackQuery?.data === 'start_verification' || ctx.callbackQuery?.data === 'request_assistance') {
    return next();
  }
  
  // Check if user is verified
  if (userId && !isUserVerified(userId)) {
    // Check if user is locked out
    if (isUserLockedOut(userId)) {
      const minutesRemaining = getRemainingLockoutTime(userId);
      await ctx.reply(
        `⚠️ You are temporarily locked out due to too many failed verification attempts.\n\n` +
        `Please try again in ${minutesRemaining} minute(s).`
      );
      return;
    }
    
    // Redirect to verification
    const verificationKeyboard = new InlineKeyboard()
      .text("🔐 Start Verification", "start_verification")
      .row()
      .text("❓ Need Help?", "request_assistance");
    
    await ctx.reply(
      "⚠️ You need to complete verification before using the bot.\n\n" +
      "Please click the button below to start the verification process.",
      { reply_markup: verificationKeyboard }
    );
    return;
  }
  
  return next();
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

// Başlangıç komutu için klavye oluştur
const startKeyboard = new InlineKeyboard()
  .text("🚀 Try for Free", "try_free")
  .text("💳 Satın Al", "buy_subscription")
  .row()
  .text("👤 Hesabım", "my_account")
  .webApp("📱 Mini App", miniAppUrl); // Doğrudan webApp butonu kullan

// /start komutuna yanıt ver
bot.command("start", async (ctx) => {
  const userId = ctx.from?.id;
  
  if (!userId) {
    await ctx.reply("Unable to identify your Telegram account. Please try again.");
    return;
  }
  
  // Check if user is already verified
  if (isUserVerified(userId)) {
    const welcomeMessage = `
Hoş geldiniz! Bu bot ile VPN hizmetinize erişebilirsiniz.

Lütfen aşağıdaki seçeneklerden birini seçin:
`;
    await ctx.reply(welcomeMessage, {
      reply_markup: startKeyboard,
    });
    return;
  }
  
  // User is not verified - show verification welcome message
  const verificationWelcomeMessage = `
🔐 **Welcome to VPN Bot - Verification Required**

For your security and to ensure only authenticated users access our services, we require all users to complete a verification process.

**Why Verification?**
• Protect your account from unauthorized access
• Ensure secure VPN service delivery
• Maintain system integrity

**How it works:**
1. Click "Start Verification" below
2. You'll receive a 6-digit verification code
3. Enter the code when prompted
4. Access granted! ✅

The verification code expires in 5 minutes and you have up to 3 attempts.

Ready to get started?
`;

  const verificationKeyboard = new InlineKeyboard()
    .text("🔐 Start Verification", "start_verification")
    .row()
    .text("❓ Need Help?", "request_assistance");

  await ctx.reply(verificationWelcomeMessage, {
    parse_mode: "Markdown",
    reply_markup: verificationKeyboard,
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

// Handle "Start Verification" button
bot.callbackQuery("start_verification", async (ctx) => {
  const userId = ctx.from?.id;
  
  if (!userId) {
    await ctx.answerCallbackQuery("Unable to identify your account.");
    return;
  }
  
  try {
    // Check if user is locked out
    if (isUserLockedOut(userId)) {
      const minutesRemaining = getRemainingLockoutTime(userId);
      await ctx.answerCallbackQuery({
        text: `You are locked out. Try again in ${minutesRemaining} minutes.`,
        show_alert: true,
      });
      return;
    }
    
    // Create verification session and generate OTP
    const code = createVerificationSession(userId);
    
    await ctx.answerCallbackQuery("Verification code generated!");
    
    await ctx.reply(
      `🔐 **Verification Code**\n\n` +
      `Your verification code is: \`${code}\`\n\n` +
      `⏱ This code will expire in 5 minutes.\n` +
      `📝 You have 3 attempts to enter the correct code.\n\n` +
      `Please use the /verify command followed by your code:\n` +
      `Example: \`/verify ${code}\``,
      { parse_mode: "Markdown" }
    );
  } catch (error: any) {
    await ctx.answerCallbackQuery({
      text: error.message || "Failed to generate verification code.",
      show_alert: true,
    });
  }
});

// Handle "Need Help?" button
bot.callbackQuery("request_assistance", async (ctx) => {
  await ctx.answerCallbackQuery("Help information");
  
  const helpMessage = `
🆘 **Verification Help**

**Common Issues:**

**Can't receive verification code?**
• Make sure you clicked "Start Verification"
• Check that the bot can send you messages
• Try the /start command again

**Code expired?**
• Verification codes expire after 5 minutes
• Click "Start Verification" again to get a new code

**Too many failed attempts?**
• After 3 incorrect attempts, you'll be locked out for 15 minutes
• Wait for the lockout period to end
• Then start verification again

**Still need help?**
• Contact support: @support_username
• Email: support@example.com

**Commands:**
/start - Start over and begin verification
/verify <code> - Enter your verification code
/help - Show general help
`;

  await ctx.reply(helpMessage, { parse_mode: "Markdown" });
});

// Add /verify command to handle code submission
bot.command("verify", async (ctx) => {
  const userId = ctx.from?.id;
  
  if (!userId) {
    await ctx.reply("Unable to identify your account. Please try again.");
    return;
  }
  
  // Check if already verified
  if (isUserVerified(userId)) {
    await ctx.reply("✅ You are already verified! Use /start to access the bot features.");
    return;
  }
  
  // Extract the code from the message
  const text = ctx.message?.text || "";
  const parts = text.split(/\s+/);
  
  if (parts.length < 2) {
    await ctx.reply(
      "❌ Please provide a verification code.\n\n" +
      "Usage: `/verify <your-code>`\n" +
      "Example: `/verify 123456`",
      { parse_mode: "Markdown" }
    );
    return;
  }
  
  const code = parts[1].trim();
  
  if (!/^\d{6}$/.test(code)) {
    await ctx.reply("❌ Invalid code format. The verification code should be 6 digits.");
    return;
  }
  
  // Verify the code
  const result = verifyOTP(userId, code);
  
  if (result.success) {
    const successKeyboard = new InlineKeyboard()
      .text("🚀 Get Started", "verified_start");
    
    await ctx.reply(
      `✅ **${result.message}**\n\n` +
      `Welcome to the VPN Bot! You can now access all features.\n\n` +
      `Click below to get started or use /start anytime.`,
      { 
        parse_mode: "Markdown",
        reply_markup: successKeyboard
      }
    );
  } else {
    // Check if user got locked out
    if (isUserLockedOut(userId)) {
      const minutesRemaining = getRemainingLockoutTime(userId);
      const retryKeyboard = new InlineKeyboard()
        .text("❓ Need Help?", "request_assistance");
      
      await ctx.reply(
        `🔒 **Account Locked**\n\n` +
        `${result.message}\n\n` +
        `You can try again in ${minutesRemaining} minute(s).`,
        { 
          parse_mode: "Markdown",
          reply_markup: retryKeyboard
        }
      );
    } else {
      const retryKeyboard = new InlineKeyboard()
        .text("🔄 Request New Code", "start_verification")
        .row()
        .text("❓ Need Help?", "request_assistance");
      
      await ctx.reply(
        `❌ ${result.message}\n\n` +
        `Please try again or request a new code if yours has expired.`,
        { reply_markup: retryKeyboard }
      );
    }
  }
});

// Handle "Get Started" button after successful verification
bot.callbackQuery("verified_start", async (ctx) => {
  await ctx.answerCallbackQuery("Loading main menu...");
  
  const welcomeMessage = `
Hoş geldiniz! Bu bot ile VPN hizmetinize erişebilirsiniz.

Lütfen aşağıdaki seçeneklerden birini seçin:
`;
  
  await ctx.reply(welcomeMessage, {
    reply_markup: startKeyboard,
  });
});

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
