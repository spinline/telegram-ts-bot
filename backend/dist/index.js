"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.bot = void 0;
require("dotenv/config");
const grammy_1 = require("grammy");
const axios_1 = __importDefault(require("axios"));
const YAML = require("yamljs");
const fs_1 = __importDefault(require("fs"));
const api_1 = require("./api");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const crypto_1 = __importDefault(require("crypto"));
// --- EXPRESS API SETUP ---
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// API Configuration
const API_BASE_URL = process.env.API_BASE_URL || "";
const API_TOKEN = process.env.API_TOKEN || "";
app.use((0, cors_1.default)()); // Frontend'den gelen isteklere izin ver
app.use(express_1.default.json());
// Health check endpoint for deployments/load balancers
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});
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
        // Fetch HWID devices for this user
        const hwidData = yield (0, api_1.getUserHwidDevices)(user.uuid);
        // Attach HWID data to user object
        const userWithHwid = Object.assign(Object.assign({}, user), { hwid: hwidData });
        console.log('User object sent to frontend:', userWithHwid); // Frontend'e gönderilen user objesini logla
        res.json(userWithHwid);
    }
    catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// --- GRAMMY BOT SETUP ---
exports.bot = new grammy_1.Bot(process.env.BOT_TOKEN || "");
// Error handler - Grammy hatalarını yakala
exports.bot.catch((err) => {
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
// Helper: Safe callback query answer (timeout hatalarını yakala)
function safeAnswerCallback(ctx, text) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            if (text) {
                yield ctx.answerCallbackQuery(text);
            }
            else {
                yield ctx.answerCallbackQuery();
            }
        }
        catch (e) {
            // Timeout hatası - normal, logla ve devam et
            if (((_a = e.message) === null || _a === void 0 ? void 0 : _a.includes("query is too old")) || ((_b = e.message) === null || _b === void 0 ? void 0 : _b.includes("query ID is invalid"))) {
                console.warn("⚠️ Callback query timeout (ignored)");
                return;
            }
            // Diğer hatalar
            console.error("❌ answerCallbackQuery error:", e.message);
        }
    });
}
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
// Validate configuration against remote API at startup
function validateConfigAtStartup() {
    return __awaiter(this, void 0, void 0, function* () {
        const squadUuid = process.env.INTERNAL_SQUAD_UUID;
        if (!squadUuid) {
            console.warn("INTERNAL_SQUAD_UUID is not set. Trial creation may fail.");
            return;
        }
        try {
            const squads = yield (0, api_1.getInternalSquads)();
            const found = Array.isArray(squads) && squads.find((s) => (s === null || s === void 0 ? void 0 : s.uuid) === squadUuid);
            if (!found) {
                const available = Array.isArray(squads) ? squads.map((s) => s === null || s === void 0 ? void 0 : s.uuid).filter(Boolean).join(", ") : "<unavailable>";
                console.error(`Configured INTERNAL_SQUAD_UUID not found on API: ${squadUuid}. Available squads: ${available}`);
            }
            else {
                console.log(`Validated internal squad: ${found.name || found.uuid}`);
            }
        }
        catch (e) {
            console.error("Failed to validate INTERNAL_SQUAD_UUID:", (e === null || e === void 0 ? void 0 : e.message) || e);
        }
    });
}
// Başlangıç komutu için klavye oluştur
const startKeyboard = new grammy_1.InlineKeyboard()
    .text("🚀 Try for Free", "try_free")
    .text("💳 Satın Al", "buy_subscription")
    .row()
    .text("👤 Hesabım", "my_account")
    .webApp("📱 Mini App", miniAppUrl); // Doğrudan webApp butonu kullan
// /start komutuna yanıt ver
exports.bot.command("start", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const welcomeMessage = `
Hoş geldiniz! Bu bot ile VPN hizmetinize erişebilirsiniz.

Lütfen aşağıdaki seçeneklerden birini seçin:
`;
    yield ctx.reply(welcomeMessage, {
        reply_markup: startKeyboard,
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
        yield exports.bot.api.sendMessage(chatId, "Happ uygulamasında açmak için aşağıdaki butona dokunun:", { reply_markup: kb });
        res.json({ ok: true });
    }
    catch (error) {
        console.error('Failed to send Happ deeplink:', (error === null || error === void 0 ? void 0 : error.message) || error);
        res.status(500).json({ error: 'Failed to send deeplink' });
    }
}));
// HWID cihazı silme endpoint
app.delete('/api/hwid/device', verifyTelegramWebAppData, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const telegramUser = req.telegramUser;
        const chatId = telegramUser === null || telegramUser === void 0 ? void 0 : telegramUser.id;
        if (!chatId) {
            return res.status(400).json({ error: 'Telegram user id not found' });
        }
        const { hwid } = req.body;
        if (!hwid) {
            return res.status(400).json({ error: 'HWID parameter is required' });
        }
        const user = yield (0, api_1.getUserByTelegramId)(chatId);
        if (!user || !user.uuid) {
            return res.status(404).json({ error: 'User not found' });
        }
        yield (0, api_1.deleteUserHwidDevice)(user.uuid, hwid);
        res.json({ ok: true, message: 'Cihaz başarıyla silindi' });
    }
    catch (error) {
        console.error('Failed to delete HWID device:', (error === null || error === void 0 ? void 0 : error.message) || error);
        res.status(500).json({ error: (error === null || error === void 0 ? void 0 : error.message) || 'Cihaz silinemedi' });
    }
}));
// Mini App'i açacak komut
exports.bot.command("app", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const miniAppUrl = process.env.MINI_APP_URL;
    if (!miniAppUrl) {
        return ctx.reply("Mini App URL'i ayarlanmamış. Lütfen yöneticinizle iletişime geçin.");
    }
    yield ctx.reply("Aşağıdaki düğmeye tıklayarak Mini App'i açabilirsiniz:", {
        reply_markup: new grammy_1.InlineKeyboard().webApp("📱 Uygulamayı Aç", miniAppUrl),
    });
}));
// Mini App'ten gelen verileri dinlemek için daha güvenli bir yöntem
exports.bot.on("message", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
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
exports.bot.command("help", (ctx) => ctx.reply("Size nasıl yardımcı olabilirim?"));
// Test komutu - bot mesaj alıyor mu kontrol için
exports.bot.command("ping", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🏓 /ping komutu alındı!');
    yield ctx.reply("🏓 Pong! Bot çalışıyor.");
}));
// Admin Panel Komutları
exports.bot.command("admin", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    console.log('🔴 /admin komutu tetiklendi - EN BAŞTA');
    try {
        const telegramId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
        console.log('🔍 /admin komutu çalıştırıldı');
        console.log('   Telegram ID:', telegramId);
        console.log('   Username:', (_b = ctx.from) === null || _b === void 0 ? void 0 : _b.username);
        console.log('   First name:', (_c = ctx.from) === null || _c === void 0 ? void 0 : _c.first_name);
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
            yield ctx.reply("⛔ Bu komutu kullanma yetkiniz yok.");
            return;
        }
        console.log('   ✅ Admin yetkisi var - panel açılıyor');
        const keyboard = new grammy_1.InlineKeyboard()
            .text("👥 Kullanıcı Listesi", "admin_users")
            .text("🔍 Kullanıcı Ara", "admin_search").row()
            .text("📢 Toplu Bildirim", "admin_broadcast")
            .text("📊 İstatistikler", "admin_stats").row()
            .text("⚙️ Kullanıcı İşlemleri", "admin_user_ops")
            .text("📝 Sistem Logları", "admin_logs").row()
            .text("💾 Sistem Durumu", "admin_status");
        yield ctx.reply("👨‍💼 *Admin Paneli*\n\nYönetim fonksiyonlarını seçin:", { reply_markup: keyboard, parse_mode: "Markdown" });
        console.log('   ✅ Admin paneli mesajı gönderildi');
    }
    catch (error) {
        console.error('❌ /admin komutunda HATA:', error.message);
        console.error('   Stack:', error.stack);
        try {
            yield ctx.reply(`❌ Hata oluştu: ${error.message}`);
        }
        catch (e) {
            console.error('   Hata mesajı da gönderilemedi:', e);
        }
    }
}));
// Admin Panel - Kullanıcı Listesi
exports.bot.callbackQuery("admin_users", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield safeAnswerCallback(ctx);
    try {
        const response = yield axios_1.default.get(`${API_BASE_URL}/api/users`, {
            headers: { Authorization: `Bearer ${API_TOKEN}` },
            params: { page: 1, take: 10 }
        });
        const users = response.data.data || [];
        let message = "👥 *Kullanıcı Listesi* (İlk 10)\n\n";
        users.forEach((user, index) => {
            const status = user.status === 'ACTIVE' ? '🟢' :
                user.status === 'LIMITED' ? '🟡' :
                    user.status === 'EXPIRED' ? '🔴' : '⚫';
            message += `${index + 1}. ${status} ${user.username}\n`;
            message += `   📊 ${(user.usedTrafficBytes / 1024 / 1024 / 1024).toFixed(2)} GB / ${(user.trafficLimitBytes / 1024 / 1024 / 1024).toFixed(0)} GB\n`;
        });
        yield ctx.editMessageText(message, { parse_mode: "Markdown" });
    }
    catch (e) {
        yield ctx.editMessageText(`❌ Hata: ${(e === null || e === void 0 ? void 0 : e.message) || 'Bilinmeyen hata'}`);
    }
}));
// Admin Panel - Kullanıcı Arama
exports.bot.callbackQuery("admin_search", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield safeAnswerCallback(ctx);
    yield ctx.editMessageText("🔍 *Kullanıcı Arama*\n\nKullanıcı adı yazın:", { parse_mode: "Markdown" });
    // TODO: Message handler ekle
}));
// Admin Panel - Toplu Bildirim
exports.bot.callbackQuery("admin_broadcast", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield safeAnswerCallback(ctx);
    yield ctx.editMessageText("📢 *Toplu Bildirim*\n\nGöndermek istediğiniz mesajı yazın:", { parse_mode: "Markdown" });
    // TODO: Message handler ve broadcast fonksiyonu ekle
}));
// Admin Panel - İstatistikler
exports.bot.callbackQuery("admin_stats", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield safeAnswerCallback(ctx);
    try {
        const response = yield axios_1.default.get(`${API_BASE_URL}/api/users`, {
            headers: { Authorization: `Bearer ${API_TOKEN}` }
        });
        const users = response.data.data || [];
        const total = users.length;
        const active = users.filter((u) => u.status === 'ACTIVE').length;
        const limited = users.filter((u) => u.status === 'LIMITED').length;
        const expired = users.filter((u) => u.status === 'EXPIRED').length;
        const totalTraffic = users.reduce((sum, u) => sum + (u.usedTrafficBytes || 0), 0);
        const avgTraffic = total > 0 ? totalTraffic / total : 0;
        const message = `📊 *Sistem İstatistikleri*\n\n` +
            `👥 Toplam Kullanıcı: ${total}\n` +
            `🟢 Aktif: ${active}\n` +
            `🟡 Limitli: ${limited}\n` +
            `🔴 Süresi Dolmuş: ${expired}\n\n` +
            `📈 Toplam Trafik: ${(totalTraffic / 1024 / 1024 / 1024).toFixed(2)} GB\n` +
            `📊 Ortalama Trafik: ${(avgTraffic / 1024 / 1024 / 1024).toFixed(2)} GB/kullanıcı`;
        yield ctx.editMessageText(message, { parse_mode: "Markdown" });
    }
    catch (e) {
        yield ctx.editMessageText(`❌ Hata: ${(e === null || e === void 0 ? void 0 : e.message) || 'Bilinmeyen hata'}`);
    }
}));
// Admin Panel - Kullanıcı İşlemleri
exports.bot.callbackQuery("admin_user_ops", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield safeAnswerCallback(ctx);
    const keyboard = new grammy_1.InlineKeyboard()
        .text("✅ Kullanıcı Aktifleştir", "admin_activate")
        .text("⛔ Kullanıcı Pasifleştir", "admin_deactivate").row()
        .text("⏰ Süre Uzat", "admin_extend")
        .text("📊 Trafik Ekle", "admin_add_traffic").row()
        .text("🔙 Geri", "admin_back");
    yield ctx.editMessageText("⚙️ *Kullanıcı İşlemleri*\n\nİşlem seçin:", { reply_markup: keyboard, parse_mode: "Markdown" });
}));
// Admin Panel - Sistem Durumu
exports.bot.callbackQuery("admin_status", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield safeAnswerCallback(ctx);
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
    yield ctx.editMessageText(message, { parse_mode: "Markdown" });
}));
// Admin Panel - Geri butonu
exports.bot.callbackQuery("admin_back", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield safeAnswerCallback(ctx);
    const keyboard = new grammy_1.InlineKeyboard()
        .text("👥 Kullanıcı Listesi", "admin_users")
        .text("🔍 Kullanıcı Ara", "admin_search").row()
        .text("📢 Toplu Bildirim", "admin_broadcast")
        .text("📊 İstatistikler", "admin_stats").row()
        .text("⚙️ Kullanıcı İşlemleri", "admin_user_ops")
        .text("📝 Sistem Logları", "admin_logs").row()
        .text("💾 Sistem Durumu", "admin_status");
    yield ctx.editMessageText("👨‍💼 *Admin Paneli*\n\nYönetim fonksiyonlarını seçin:", { reply_markup: keyboard, parse_mode: "Markdown" });
}));
// "Try for Free" düğmesine basıldığında (orijinal callback)
exports.bot.callbackQuery("try_free", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield handleTryFree(ctx);
}));
// "Satın Al" düğmesine basıldığında
exports.bot.callbackQuery("buy_subscription", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield safeAnswerCallback(ctx, "Çok yakında!");
}));
// "Hesabım" düğmesine basıldığında
exports.bot.callbackQuery("my_account", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const telegramId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
    if (!telegramId) {
        yield safeAnswerCallback(ctx, "Hata!");
        yield ctx.reply("Telegram ID'niz alınamadı. Lütfen tekrar deneyin.");
        return;
    }
    try {
        yield safeAnswerCallback(ctx, "Hesap bilgileriniz getiriliyor...");
        const user = yield (0, api_1.getUserByTelegramId)(telegramId);
        if (!user) {
            yield ctx.reply("Sistemde kayıtlı bir hesabınız bulunamadı. Lütfen önce 'Try for Free' seçeneği ile bir deneme hesabı oluşturun.");
            return;
        }
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
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
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
            // Kullanıcı adı çakışmalarını önlemek için benzersiz bir username üret
            let finalUsername = username;
            try {
                const existingByUsername = yield (0, api_1.getUserByUsername)(username);
                if (existingByUsername) {
                    const base = username.slice(0, Math.max(0, 30));
                    const suffix = `-${Math.floor(1000 + Math.random() * 9000)}`;
                    finalUsername = `${base}${suffix}`;
                }
            }
            catch (e) {
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
            let createdUser = null;
            const baseName = finalUsername.slice(0, Math.max(0, 30));
            for (let attempt = 0; attempt < 5; attempt++) {
                try {
                    createdUser = yield (0, api_1.createUser)(newUser);
                    break;
                }
                catch (err) {
                    const msg = String((err === null || err === void 0 ? void 0 : err.message) || "");
                    const looksLikeUsernameConflict = msg.includes("A018") || msg.includes("409") || msg.toLowerCase().includes("username");
                    if (!looksLikeUsernameConflict || attempt === 4) {
                        throw err;
                    }
                    const suffix = `-${Math.floor(1000 + Math.random() * 9000)}`;
                    finalUsername = `${baseName}${suffix}`;
                    newUser.username = finalUsername;
                }
            }
            const myAccountKeyboard = new grammy_1.InlineKeyboard().text("👤 Hesabım", "my_account");
            yield ctx.reply(`🎉 Deneme hesabınız başarıyla oluşturuldu, @${username}!\n\nHesabınız <b>3 gün</b> geçerlidir ve <b>2 GB</b> trafik limitiniz bulunmaktadır.\n\nAşağıdaki butona tıklayarak hesap detaylarınızı görebilirsiniz.`, {
                parse_mode: "HTML",
                reply_markup: myAccountKeyboard,
            });
        }
        catch (error) {
            const telegramIdForCatch = (_g = ctx.from) === null || _g === void 0 ? void 0 : _g.id;
            const msg = String((error === null || error === void 0 ? void 0 : error.message) || "");
            // A018 genellikle sunucuda mevcut hesap/benzersizlik ihlali durumunu ifade eder
            if (msg.includes("A018") && telegramIdForCatch) {
                try {
                    const existing = yield (0, api_1.getUserByTelegramId)(telegramIdForCatch);
                    if (existing) {
                        const myAccountKeyboard = new grammy_1.InlineKeyboard().text("👤 Hesabım", "my_account");
                        yield ((_h = ctx.answerCallbackQuery) === null || _h === void 0 ? void 0 : _h.call(ctx));
                        yield ctx.reply("Bu Telegram hesabıyla zaten bir kullanıcı mevcut. Hesap detaylarını görüntülemek için aşağıdaki düğmeyi kullanın.", { reply_markup: myAccountKeyboard });
                        return;
                    }
                }
                catch (_k) { }
            }
            yield ((_j = ctx.answerCallbackQuery) === null || _j === void 0 ? void 0 : _j.call(ctx, "Hata!"));
            yield ctx.reply(`Kullanıcı oluşturulurken bir hata oluştu: ${error.message}`);
        }
    });
}
// Internal test endpoint: webhook'u manuel test etmek için (PROD: koruma gerektirir)
app.post('/internal/test-webhook/:telegramId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = req.headers['x-internal-token'];
    const expected = process.env.INTERNAL_NOTIFY_TOKEN;
    if (!expected || token !== expected) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    const telegramIdParam = req.params.telegramId;
    const reason = (_a = req.body) === null || _a === void 0 ? void 0 : _a.reason;
    try {
        const user = yield (0, api_1.getUserByTelegramId)(Number(telegramIdParam));
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Webhook event simülasyonu
        const mockEvent = {
            event: 'user.limited',
            timestamp: new Date().toISOString(),
            data: { user }
        };
        const { handleWebhook } = yield Promise.resolve().then(() => __importStar(require('./webhook')));
        const result = yield handleWebhook(exports.bot, mockEvent, reason);
        res.json(result);
    }
    catch (e) {
        console.error('Internal test error:', e);
        res.status(500).json({ error: String((e === null || e === void 0 ? void 0 : e.message) || e) });
    }
}));
// Webhook endpoint: RemnaWave panelinden gelen olayları dinle
app.post('/endpoint', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const signature = req.headers['x-webhook-signature'];
        const webhookSecret = process.env.WEBHOOK_SECRET;
        // Webhook secret varsa VE signature header varsa imza doğrula
        if (webhookSecret && signature) {
            const { verifyWebhookSignature } = yield Promise.resolve().then(() => __importStar(require('./webhook')));
            const payload = JSON.stringify(req.body);
            const isValid = verifyWebhookSignature(payload, signature, webhookSecret);
            if (!isValid) {
                console.warn('⚠️ Invalid webhook signature - rejecting request');
                return res.status(401).json({ error: 'Invalid signature' });
            }
        }
        else if (webhookSecret && !signature) {
            console.warn('⚠️ Webhook secret configured but no signature received');
        }
        const event = req.body;
        console.log('📡 Webhook received:', event.event);
        const { handleWebhook } = yield Promise.resolve().then(() => __importStar(require('./webhook')));
        const result = yield handleWebhook(exports.bot, event);
        res.json({ received: true, result });
    }
    catch (e) {
        console.error('Webhook error:', (e === null || e === void 0 ? void 0 : e.message) || e);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// ...existing code...
function startApp() {
    return __awaiter(this, void 0, void 0, function* () {
        // Start the Express server
        app.listen(port, () => {
            console.log(`API server listening on port ${port}`);
            console.log(`Webhook endpoint: POST /endpoint (RemnaWave)`);
        });
        // Validate configuration
        yield validateConfigAtStartup();
        // Start Telegram bot with long polling for commands
        // This is needed for /start, /admin and other Telegram interactions
        console.log("🤖 Starting Telegram bot (long polling)...");
        try {
            yield exports.bot.start({
                onStart: (botInfo) => {
                    console.log(`✅ Bot @${botInfo.username} is running!`);
                    console.log(`📱 Commands: /start, /admin, /help, /app`);
                    console.log(`⚡ RemnaWave webhook: POST /endpoint`);
                }
            });
        }
        catch (error) {
            console.error("❌ Failed to start bot:", error === null || error === void 0 ? void 0 : error.message);
            console.error("Check if BOT_TOKEN is correct in .env");
        }
        // Handle graceful shutdown
        const shutdown = () => __awaiter(this, void 0, void 0, function* () {
            console.log('Shutting down gracefully...');
            yield exports.bot.stop();
            process.exit(0);
        });
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    });
}
startApp();
