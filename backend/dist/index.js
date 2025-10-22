"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const grammy_1 = require("grammy");
const YAML = require("yamljs");
const fs_1 = __importDefault(require("fs"));
const api_1 = require("./api");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const crypto_1 = __importDefault(require("crypto"));
const verificationManager_1 = require("./verificationManager");
// --- EXPRESS API SETUP ---
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)()); // Frontend'den gelen isteklere izin ver
app.use(express_1.default.json());
// Telegram'dan gelen veriyi doğrulamak için middleware
const verifyTelegramWebAppData = (req, res, next) => {
    const initData = req.headers['x-telegram-init-data'];
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
    const secretKey = crypto_1.default.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto_1.default.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    if (calculatedHash === hash) {
        // Doğrulama başarılı, user verisini req objesine ekle
        const userParam = params.get('user');
        if (userParam) {
            req.telegramUser = JSON.parse(userParam);
        }
        return next();
    }
    return res.status(403).json({ error: 'Invalid hash.' });
};
// Mini App için hesap bilgisi endpoint'i
app.get('/api/account', verifyTelegramWebAppData, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const telegramUser = req.telegramUser;
        if (!telegramUser || !telegramUser.id) {
            return res.status(400).json({ error: 'User data not found in Telegram initData' });
        }
        const telegramId = telegramUser.id;
        const user = yield (0, api_1.getUserByTelegramId)(telegramId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        console.log('User object sent to frontend:', user); // Frontend'e gönderilen user objesini logla
        res.json(user);
    }
    catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// --- GRAMMY BOT SETUP ---
const bot = new grammy_1.Bot(process.env.BOT_TOKEN || "");
// Middleware to check verification status
bot.use((ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const userId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
    // Skip verification check for /start and /verify commands
    if (ctx.message && 'text' in ctx.message) {
        const text = ctx.message.text;
        if ((text === null || text === void 0 ? void 0 : text.startsWith('/start')) || (text === null || text === void 0 ? void 0 : text.startsWith('/verify'))) {
            return next();
        }
    }
    // Skip verification check for verification-related callbacks
    if (((_b = ctx.callbackQuery) === null || _b === void 0 ? void 0 : _b.data) === 'start_verification' || ((_c = ctx.callbackQuery) === null || _c === void 0 ? void 0 : _c.data) === 'request_assistance') {
        return next();
    }
    // Check if user is verified
    if (userId && !(0, verificationManager_1.isUserVerified)(userId)) {
        // Check if user is locked out
        if ((0, verificationManager_1.isUserLockedOut)(userId)) {
            const minutesRemaining = (0, verificationManager_1.getRemainingLockoutTime)(userId);
            yield ctx.reply(`⚠️ You are temporarily locked out due to too many failed verification attempts.\n\n` +
                `Please try again in ${minutesRemaining} minute(s).`);
            return;
        }
        // Redirect to verification
        const verificationKeyboard = new grammy_1.InlineKeyboard()
            .text("🔐 Start Verification", "start_verification")
            .row()
            .text("❓ Need Help?", "request_assistance");
        yield ctx.reply("⚠️ You need to complete verification before using the bot.\n\n" +
            "Please click the button below to start the verification process.", { reply_markup: verificationKeyboard });
        return;
    }
    return next();
}));
// OpenAPI YAML dosyasını yükle
let openApiDocument;
const openApiFilePath = "./openapi.yaml";
try {
    const yamlContent = fs_1.default.readFileSync(openApiFilePath, "utf8");
    openApiDocument = YAML.parse(yamlContent);
    console.log("OpenAPI document loaded.");
}
catch (error) {
    console.error("Error loading OpenAPI document:", error);
}
// MINI_APP_URL'i burada al
const miniAppUrl = process.env.MINI_APP_URL || "";
// Public base URL (for deeplink redirects). If not provided, derive from incoming request.
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "";
// Başlangıç komutu için klavye oluştur
const startKeyboard = new grammy_1.InlineKeyboard()
    .text("🚀 Try for Free", "try_free")
    .text("💳 Satın Al", "buy_subscription")
    .row()
    .text("👤 Hesabım", "my_account")
    .webApp("📱 Mini App", miniAppUrl); // Doğrudan webApp butonu kullan
// /start komutuna yanıt ver
bot.command("start", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        yield ctx.reply("Unable to identify your Telegram account. Please try again.");
        return;
    }
    // Check if user is already verified
    if ((0, verificationManager_1.isUserVerified)(userId)) {
        const welcomeMessage = `
Hoş geldiniz! Bu bot ile VPN hizmetinize erişebilirsiniz.

Lütfen aşağıdaki seçeneklerden birini seçin:
`;
        yield ctx.reply(welcomeMessage, {
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
    const verificationKeyboard = new grammy_1.InlineKeyboard()
        .text("🔐 Start Verification", "start_verification")
        .row()
        .text("❓ Need Help?", "request_assistance");
    yield ctx.reply(verificationWelcomeMessage, {
        parse_mode: "Markdown",
        reply_markup: verificationKeyboard,
    });
}));
// Basit deeplink redirect sayfası (https -> happ://)
app.get('/redirect', (req, res) => {
    const to = req.query.to;
    const fallback = req.query.fallback || 'https://t.me/';
    if (!to) {
        return res.status(400).send('Missing to parameter');
    }
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Açılıyor…</title></head><body style="font-family:system-ui;padding:24px;background:#111;color:#eee"><h2>Uygulamada açılıyor…</h2><p>Eğer otomatik açılmazsa <a id="open">buraya dokunun</a>.</p><script>const to=decodeURIComponent(${JSON.stringify(encodeURIComponent(to))});const fb=decodeURIComponent(${JSON.stringify(encodeURIComponent(fallback))});function open(){window.location.href=to;}document.getElementById('open').setAttribute('href',to);open();setTimeout(()=>{if(document.hidden)return;window.location.href=fb;},1500);</script></body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
});
// Mini App'ten Happ deeplink'i Telegram sohbetine gönderen köprü endpoint
app.post('/api/happ/open', verifyTelegramWebAppData, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const telegramUser = req.telegramUser;
        const chatId = telegramUser === null || telegramUser === void 0 ? void 0 : telegramUser.id;
        if (!chatId) {
            return res.status(400).json({ error: 'Telegram user id not found' });
        }
        const user = yield (0, api_1.getUserByTelegramId)(chatId);
        const link = (_a = user === null || user === void 0 ? void 0 : user.happ) === null || _a === void 0 ? void 0 : _a.cryptoLink;
        if (!link) {
            return res.status(404).json({ error: 'CryptoLink not found for user' });
        }
        // Redirect URL (https), constructing absolute base URL
        const proto = req.headers['x-forwarded-proto'] || (PUBLIC_BASE_URL.startsWith('https') ? 'https' : 'http');
        const hostFromHeader = req.headers['x-forwarded-host'] || req.headers.host;
        const base = PUBLIC_BASE_URL || `${proto}://${hostFromHeader}`;
        const iosStore = 'https://apps.apple.com/us/app/happ-proxy-utility/id6504287215';
        const androidStore = 'https://play.google.com/store/apps/details?id=com.happproxy';
        const fallback = iosStore; // tek fallback bırakıyoruz
        const redirectUrl = `${base}/redirect?to=${encodeURIComponent(link)}&fallback=${encodeURIComponent(fallback)}`;
        const kb = new grammy_1.InlineKeyboard().url("Happ’ta Aç", redirectUrl);
        yield bot.api.sendMessage(chatId, "Happ uygulamasında açmak için aşağıdaki butona dokunun:", { reply_markup: kb });
        res.json({ ok: true });
    }
    catch (error) {
        console.error('Failed to send Happ deeplink:', (error === null || error === void 0 ? void 0 : error.message) || error);
        res.status(500).json({ error: 'Failed to send deeplink' });
    }
}));
// Mini App'i açacak komut
bot.command("app", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const miniAppUrl = process.env.MINI_APP_URL;
    if (!miniAppUrl) {
        return ctx.reply("Mini App URL'i ayarlanmamış. Lütfen yöneticinizle iletişime geçin.");
    }
    yield ctx.reply("Aşağıdaki düğmeye tıklayarak Mini App'i açabilirsiniz:", {
        reply_markup: new grammy_1.InlineKeyboard().webApp("📱 Uygulamayı Aç", miniAppUrl),
    });
}));
// Mini App'ten gelen verileri dinlemek için daha güvenli bir yöntem
bot.on("message", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    // Mesajın bir "web_app_data" içerip içermediğini kontrol et
    if (ctx.message && "web_app_data" in ctx.message && ctx.message.web_app_data) {
        try {
            const data = JSON.parse(ctx.message.web_app_data.data);
            if (data.command === 'try_free') {
                yield handleTryFree(ctx);
            }
        }
        catch (error) {
            console.error("Error processing web_app_data", error);
        }
    }
}));
bot.command("help", (ctx) => ctx.reply("Size nasıl yardımcı olabilirim?"));
// Handle "Start Verification" button
bot.callbackQuery("start_verification", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        yield ctx.answerCallbackQuery("Unable to identify your account.");
        return;
    }
    try {
        // Check if user is locked out
        if ((0, verificationManager_1.isUserLockedOut)(userId)) {
            const minutesRemaining = (0, verificationManager_1.getRemainingLockoutTime)(userId);
            yield ctx.answerCallbackQuery({
                text: `You are locked out. Try again in ${minutesRemaining} minutes.`,
                show_alert: true,
            });
            return;
        }
        // Create verification session and generate OTP
        const code = (0, verificationManager_1.createVerificationSession)(userId);
        yield ctx.answerCallbackQuery("Verification code generated!");
        yield ctx.reply(`🔐 **Verification Code**\n\n` +
            `Your verification code is: \`${code}\`\n\n` +
            `⏱ This code will expire in 5 minutes.\n` +
            `📝 You have 3 attempts to enter the correct code.\n\n` +
            `Please use the /verify command followed by your code:\n` +
            `Example: \`/verify ${code}\``, { parse_mode: "Markdown" });
    }
    catch (error) {
        yield ctx.answerCallbackQuery({
            text: error.message || "Failed to generate verification code.",
            show_alert: true,
        });
    }
}));
// Handle "Need Help?" button
bot.callbackQuery("request_assistance", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.answerCallbackQuery("Help information");
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
    yield ctx.reply(helpMessage, { parse_mode: "Markdown" });
}));
// Add /verify command to handle code submission
bot.command("verify", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        yield ctx.reply("Unable to identify your account. Please try again.");
        return;
    }
    // Check if already verified
    if ((0, verificationManager_1.isUserVerified)(userId)) {
        yield ctx.reply("✅ You are already verified! Use /start to access the bot features.");
        return;
    }
    // Extract the code from the message
    const text = ((_b = ctx.message) === null || _b === void 0 ? void 0 : _b.text) || "";
    const parts = text.split(/\s+/);
    if (parts.length < 2) {
        yield ctx.reply("❌ Please provide a verification code.\n\n" +
            "Usage: `/verify <your-code>`\n" +
            "Example: `/verify 123456`", { parse_mode: "Markdown" });
        return;
    }
    const code = parts[1].trim();
    if (!/^\d{6}$/.test(code)) {
        yield ctx.reply("❌ Invalid code format. The verification code should be 6 digits.");
        return;
    }
    // Verify the code
    const result = (0, verificationManager_1.verifyOTP)(userId, code);
    if (result.success) {
        const successKeyboard = new grammy_1.InlineKeyboard()
            .text("🚀 Get Started", "verified_start");
        yield ctx.reply(`✅ **${result.message}**\n\n` +
            `Welcome to the VPN Bot! You can now access all features.\n\n` +
            `Click below to get started or use /start anytime.`, {
            parse_mode: "Markdown",
            reply_markup: successKeyboard
        });
    }
    else {
        // Check if user got locked out
        if ((0, verificationManager_1.isUserLockedOut)(userId)) {
            const minutesRemaining = (0, verificationManager_1.getRemainingLockoutTime)(userId);
            const retryKeyboard = new grammy_1.InlineKeyboard()
                .text("❓ Need Help?", "request_assistance");
            yield ctx.reply(`🔒 **Account Locked**\n\n` +
                `${result.message}\n\n` +
                `You can try again in ${minutesRemaining} minute(s).`, {
                parse_mode: "Markdown",
                reply_markup: retryKeyboard
            });
        }
        else {
            const retryKeyboard = new grammy_1.InlineKeyboard()
                .text("🔄 Request New Code", "start_verification")
                .row()
                .text("❓ Need Help?", "request_assistance");
            yield ctx.reply(`❌ ${result.message}\n\n` +
                `Please try again or request a new code if yours has expired.`, { reply_markup: retryKeyboard });
        }
    }
}));
// Handle "Get Started" button after successful verification
bot.callbackQuery("verified_start", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.answerCallbackQuery("Loading main menu...");
    const welcomeMessage = `
Hoş geldiniz! Bu bot ile VPN hizmetinize erişebilirsiniz.

Lütfen aşağıdaki seçeneklerden birini seçin:
`;
    yield ctx.reply(welcomeMessage, {
        reply_markup: startKeyboard,
    });
}));
// "Try for Free" düğmesine basıldığında (orijinal callback)
bot.callbackQuery("try_free", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield handleTryFree(ctx);
}));
// "Satın Al" düğmesine basıldığında
bot.callbackQuery("buy_subscription", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.answerCallbackQuery({
        text: "Çok yakında!",
        show_alert: true,
    });
}));
// "Hesabım" düğmesine basıldığında
bot.callbackQuery("my_account", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const telegramId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
    if (!telegramId) {
        yield ctx.answerCallbackQuery("Hata!");
        yield ctx.reply("Telegram ID'niz alınamadı. Lütfen tekrar deneyin.");
        return;
    }
    try {
        yield ctx.answerCallbackQuery("Hesap bilgileriniz getiriliyor...");
        const user = yield (0, api_1.getUserByTelegramId)(telegramId);
        if (!user) {
            yield ctx.reply("Sistemde kayıtlı bir hesabınız bulunamadı. Lütfen önce 'Try for Free' seçeneği ile bir deneme hesabı oluşturun.");
            return;
        }
        // Satın al butonu
        const buyKeyboard = new grammy_1.InlineKeyboard().text("💳 Yeni Abonelik Satın Al", "buy_subscription");
        // Eğer hesap limitli veya süresi dolmuşsa, kullanıcıyı bilgilendir ve satın almaya yönlendir
        if (user.status === 'LIMITED' || user.status === 'EXPIRED') {
            let reason = user.status === 'LIMITED' ? "Trafik kotanız doldu." : "Abonelik süreniz sona erdi.";
            yield ctx.reply(`
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
        const escapeHTML = (text) => text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&/g, "&amp;");
        const appDownloadKeyboard = new grammy_1.InlineKeyboard()
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
        yield ctx.reply(accountInfo, {
            parse_mode: "HTML",
            reply_markup: appDownloadKeyboard
        });
    }
    catch (error) {
        yield ctx.answerCallbackQuery("Hata!");
        yield ctx.reply(`Hesap bilgileriniz alınırken bir hata oluştu: ${error.message}`);
    }
}));
// "Try for Free" mantığını yeniden kullanılabilir bir fonksiyona taşıyalım
function handleTryFree(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g;
        const telegramId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
        const username = (_b = ctx.from) === null || _b === void 0 ? void 0 : _b.username;
        if (!telegramId) {
            yield ((_c = ctx.answerCallbackQuery) === null || _c === void 0 ? void 0 : _c.call(ctx, "Hata!"));
            yield ctx.reply("Telegram ID'niz alınamadı. Lütfen tekrar deneyin.");
            return;
        }
        if (!username) {
            yield ((_d = ctx.answerCallbackQuery) === null || _d === void 0 ? void 0 : _d.call(ctx));
            yield ctx.reply("Kayıt olabilmek için bir Telegram kullanıcı adınızın olması gerekmektedir.");
            return;
        }
        try {
            // Kullanıcının zaten var olup olmadığını Telegram ID ile kontrol et
            const existingUser = yield (0, api_1.getUserByTelegramId)(telegramId);
            if (existingUser) {
                yield ((_e = ctx.answerCallbackQuery) === null || _e === void 0 ? void 0 : _e.call(ctx));
                yield ctx.reply(`Bu Telegram hesabı ile zaten bir kullanıcı mevcut: <code>${existingUser.username}</code>\n\nHesap durumunuzu kontrol etmek için ana menüdeki "Hesap Durumu" düğmesini kullanabilirsiniz.`, { parse_mode: "HTML" });
                return;
            }
            yield ((_f = ctx.answerCallbackQuery) === null || _f === void 0 ? void 0 : _f.call(ctx, "Deneme hesabınız oluşturuluyor..."));
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
            const createdUser = yield (0, api_1.createUser)(newUser);
            const myAccountKeyboard = new grammy_1.InlineKeyboard().text("👤 Hesabım", "my_account");
            yield ctx.reply(`🎉 Deneme hesabınız başarıyla oluşturuldu, @${username}!\n\nHesabınız <b>3 gün</b> geçerlidir ve <b>2 GB</b> trafik limitiniz bulunmaktadır.\n\nAşağıdaki butona tıklayarak hesap detaylarınızı görebilirsiniz.`, {
                parse_mode: "HTML",
                reply_markup: myAccountKeyboard,
            });
        }
        catch (error) {
            yield ((_g = ctx.answerCallbackQuery) === null || _g === void 0 ? void 0 : _g.call(ctx, "Hata!"));
            yield ctx.reply(`Kullanıcı oluşturulurken bir hata oluştu: ${error.message}`);
        }
    });
}
function startApp() {
    return __awaiter(this, void 0, void 0, function* () {
        // Start the Express server
        app.listen(port, () => {
            console.log(`API server listening on port ${port}`);
        });
        // Start the Telegram bot
        bot.start();
        console.log("Bot started!");
    });
}
startApp();
