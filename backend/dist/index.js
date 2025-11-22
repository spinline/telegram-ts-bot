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
const yaml = __importStar(require("js-yaml"));
const fs_1 = __importDefault(require("fs"));
const api_1 = require("./api");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const crypto_1 = __importDefault(require("crypto"));
// 🎯 NEW: Import modern architecture layers
const env_1 = require("./config/env");
const error_middleware_1 = require("./middlewares/error.middleware");
const session_middleware_1 = require("./middlewares/session.middleware");
const user_service_1 = require("./services/user.service");
const notification_service_1 = require("./services/notification.service");
const logger_1 = require("./utils/logger");
// --- EXPRESS API SETUP ---
const app = (0, express_1.default)();
const port = env_1.env.PORT;
// API Configuration (still used by legacy code)
const API_BASE_URL = env_1.env.API_BASE_URL;
const API_TOKEN = env_1.env.API_TOKEN;
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
exports.bot = new grammy_1.Bot(env_1.env.BOT_TOKEN);
// 🎯 NEW: Use error handler middleware
exports.bot.catch(error_middleware_1.errorHandler);
// 🗑️ DELETED: Old adminSessions Map - now using sessionManager
// interface AdminSession { ... }
// const adminSessions = new Map<number, AdminSession>();
// 🗑️ DELETED: Old safeAnswerCallback - now imported from middleware
// async function safeAnswerCallback(ctx: any, text?: string) { ... }
// Middleware: Sadece hata durumlarını logla
exports.bot.use((ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    yield next();
}));
// Admin mesaj handler - session tabanlı işlemler
exports.bot.on("message:text", (ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
    const text = ctx.message.text;
    if (!userId || !text) {
        return next();
    }
    // Cancel komutu
    if (text === '/cancel') {
        if (session_middleware_1.sessionManager.has(userId)) {
            session_middleware_1.sessionManager.delete(userId);
            yield ctx.reply("❌ İşlem iptal edildi.");
            return;
        }
    }
    const session = session_middleware_1.sessionManager.get(userId);
    if (!session || !session.action) {
        return next(); // Normal komut işlemeye devam et
    }
    // Admin session varsa işle
    try {
        if (session.action === 'search') {
            const query = text.trim();
            try {
                const results = yield user_service_1.userService.searchUsers(query);
                if (results.length === 0) {
                    yield ctx.reply(`❌ Kullanıcı bulunamadı: ${query}`);
                    session_middleware_1.sessionManager.delete(userId);
                    return;
                }
                if (results.length === 1) {
                    const user = results[0];
                    const message = yield user_service_1.userService.getUserDetailsMessage(user.username);
                    // Kullanıcı detayına gitmek için buton ekle
                    const keyboard = new grammy_1.InlineKeyboard()
                        .text("⏰ Süre Uzat", `admin_extend_${user.username}`)
                        .text("📊 Trafik Ekle", `admin_add_traffic_${user.username}`).row()
                        .text("🔄 Cihaz Sıfırla", `admin_reset_devices_${user.username}`).row()
                        .text("🔙 Kullanıcı Listesi", "admin_users");
                    yield ctx.reply(message, { parse_mode: "Markdown", reply_markup: keyboard });
                }
                else {
                    // Birden fazla sonuç varsa listele
                    const message = `🔍 *Arama Sonuçları* (${results.length})\n\nLütfen bir kullanıcı seçin:`;
                    const keyboard = new grammy_1.InlineKeyboard();
                    results.slice(0, 10).forEach((user) => {
                        const status = user.status === 'ACTIVE' ? '🟢' :
                            user.status === 'LIMITED' ? '🟡' :
                                user.status === 'EXPIRED' ? '🔴' : '⚫';
                        keyboard.text(`${status} ${user.username}`, `user_detail_${user.username}`).row();
                    });
                    keyboard.text("🔙 İptal", "admin_user_ops");
                    yield ctx.reply(message, { parse_mode: "Markdown", reply_markup: keyboard });
                }
                session_middleware_1.sessionManager.delete(userId);
            }
            catch (e) {
                yield ctx.reply(`❌ Hata: ${(e === null || e === void 0 ? void 0 : e.message) || 'Kullanıcı bulunamadı'}`);
                session_middleware_1.sessionManager.delete(userId);
            }
        }
        else if (session.action === 'broadcast') {
            const message = text;
            yield ctx.reply("📤 Toplu bildirim gönderiliyor...");
            try {
                const result = yield notification_service_1.notificationService.broadcast(message);
                yield ctx.reply(`✅ Toplu bildirim tamamlandı!\n\n` +
                    `📤 Gönderilen: ${result.sent}\n` +
                    `❌ Başarısız: ${result.failed}\n` +
                    `👥 Toplam: ${result.sent + result.failed}`);
                session_middleware_1.sessionManager.delete(userId);
            }
            catch (e) {
                logger_1.logger.error('Broadcast error:', e.message);
                yield ctx.reply(`❌ Hata: ${(e === null || e === void 0 ? void 0 : e.message) || 'Bilinmeyen hata'}`);
                session_middleware_1.sessionManager.delete(userId);
            }
        }
        else if (session.action === 'extend_days') {
            const days = parseInt(text);
            const username = session.targetUser;
            if (isNaN(days) || days <= 0) {
                yield ctx.reply("❌ Lütfen geçerli bir gün sayısı girin (Örn: 30).");
                return;
            }
            if (!username) {
                yield ctx.reply("❌ Hedef kullanıcı bulunamadı.");
                session_middleware_1.sessionManager.delete(userId);
                return;
            }
            try {
                yield ctx.reply("⏳ İşlem yapılıyor...");
                const updatedUser = yield user_service_1.userService.extendTime(username, days);
                const newDate = new Date(updatedUser.expireAt).toLocaleDateString('tr-TR');
                yield ctx.reply(`✅ *${username}* kullanıcısının süresi *${days} gün* uzatıldı.\n📅 Yeni Bitiş: ${newDate}`, { parse_mode: "Markdown" });
                session_middleware_1.sessionManager.delete(userId);
            }
            catch (e) {
                yield ctx.reply(`❌ Hata: ${(e === null || e === void 0 ? void 0 : e.message) || 'Süre uzatılamadı'}`);
                session_middleware_1.sessionManager.delete(userId);
            }
        }
        else if (session.action === 'add_traffic') {
            const gb = parseFloat(text);
            const username = session.targetUser;
            if (isNaN(gb) || gb <= 0) {
                yield ctx.reply("❌ Lütfen geçerli bir GB miktarı girin (Örn: 10).");
                return;
            }
            if (!username) {
                yield ctx.reply("❌ Hedef kullanıcı bulunamadı.");
                session_middleware_1.sessionManager.delete(userId);
                return;
            }
            try {
                yield ctx.reply("⏳ İşlem yapılıyor...");
                const updatedUser = yield user_service_1.userService.addTraffic(username, gb);
                const limitGB = (updatedUser.trafficLimitBytes / 1024 / 1024 / 1024).toFixed(0);
                yield ctx.reply(`✅ *${username}* kullanıcısına *${gb} GB* trafik eklendi.\n📊 Yeni Limit: ${limitGB} GB`, { parse_mode: "Markdown" });
                session_middleware_1.sessionManager.delete(userId);
            }
            catch (e) {
                yield ctx.reply(`❌ Hata: ${(e === null || e === void 0 ? void 0 : e.message) || 'Trafik eklenemedi'}`);
                session_middleware_1.sessionManager.delete(userId);
            }
        }
    }
    catch (e) {
        console.error('Admin session error:', e);
        yield ctx.reply(`❌ İşlem sırasında hata oluştu: ${e === null || e === void 0 ? void 0 : e.message}`);
        session_middleware_1.sessionManager.delete(userId);
    }
}));
// OpenAPI YAML dosyasını yükle
let openApiDocument;
const openApiFilePath = "./openapi.yaml";
try {
    const yamlContent = fs_1.default.readFileSync(openApiFilePath, "utf8");
    openApiDocument = yaml.load(yamlContent);
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
// NOT: Bu handler tüm mesajları yakalamamalı, sadece web_app_data olanları
exports.bot.on("message:web_app_data", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = JSON.parse(ctx.message.web_app_data.data);
        if (data.command === 'try_free') {
            yield handleTryFree(ctx);
        }
    }
    catch (error) {
        console.error("Error processing web_app_data", error);
    }
}));
exports.bot.command("help", (ctx) => ctx.reply("Size nasıl yardımcı olabilirim?"));
// Admin Panel Komutları
exports.bot.command("admin", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const telegramId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
        // Admin kontrolü
        const adminIdsString = process.env.ADMIN_TELEGRAM_IDS || '';
        const adminIdsArray = adminIdsString.split(',').map(id => id.trim());
        const telegramIdString = String(telegramId);
        // String ve number kontrolü
        const isAdmin = adminIdsArray.includes(telegramIdString) ||
            adminIdsArray.map(id => parseInt(id)).includes(telegramId || 0);
        if (!isAdmin) {
            yield ctx.reply("⛔ Bu komutu kullanma yetkiniz yok.");
            return;
        }
        const keyboard = new grammy_1.InlineKeyboard()
            .text("⚙️ Kullanıcı İşlemleri", "admin_user_ops")
            .text("📢 Toplu Bildirim", "admin_broadcast").row()
            .text("📊 İstatistikler", "admin_stats")
            .text("📝 Sistem Logları", "admin_logs").row()
            .text("💾 Sistem Durumu", "admin_status");
        yield ctx.reply("👨‍💼 *Admin Paneli*\n\nYönetim fonksiyonlarını seçin:", { reply_markup: keyboard, parse_mode: "Markdown" });
    }
    catch (error) {
        console.error('❌ /admin error:', error.message);
        try {
            yield ctx.reply(`❌ Hata oluştu: ${error.message}`);
        }
        catch (e) {
            console.error('Failed to send error message:', e);
        }
    }
}));
// Admin Panel - Kullanıcı Listesi
exports.bot.callbackQuery(/^admin_users(_page_(\d+))?(_sort_(\w+))?(_filter_(\w+))?$/, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, error_middleware_1.safeAnswerCallback)(ctx);
    const page = ctx.match && ctx.match[2] ? parseInt(ctx.match[2]) : 1;
    const sort = (ctx.match && ctx.match[4] ? ctx.match[4] : undefined);
    const filter = (ctx.match && ctx.match[6] ? ctx.match[6] : 'ALL');
    const limit = 10;
    try {
        const { users, total } = yield user_service_1.userService.getUsers(page, limit, sort, filter);
        if (!users || (users.length === 0 && filter === 'ALL')) {
            yield (0, error_middleware_1.safeEditMessageText)(ctx, "ℹ️ Sistemde henüz kullanıcı bulunmuyor.");
            return;
        }
        const totalPages = Math.ceil(total / limit);
        const sortLabel = sort === 'traffic' ? ' (Trafik)' : sort === 'date' ? ' (Tarih)' : sort === 'status' ? ' (Durum)' : '';
        const filterLabel = filter !== 'ALL' ? ` [${filter}]` : '';
        const message = `👥 *Kullanıcı Listesi*${sortLabel}${filterLabel} (Sayfa ${page}/${totalPages})`;
        const keyboard = new grammy_1.InlineKeyboard();
        const sortParam = sort ? `_sort_${sort}` : '';
        const filterParam = filter ? `_filter_${filter}` : '';
        // Filtreleme Butonları
        keyboard
            .text(filter === 'ALL' ? "✅ Tümü" : "Tümü", `admin_users_page_1${sortParam}_filter_ALL`)
            .text(filter === 'ACTIVE' ? "✅ Aktif" : "Aktif", `admin_users_page_1${sortParam}_filter_ACTIVE`)
            .text(filter === 'EXPIRED' ? "✅ Bitti" : "Bitti", `admin_users_page_1${sortParam}_filter_EXPIRED`)
            .row();
        // Sıralama Butonları
        keyboard
            .text(sort === 'traffic' ? "✅ Trafik" : "Trafik", `admin_users_page_1_sort_traffic${filterParam}`)
            .text(sort === 'date' ? "✅ Tarih" : "Tarih", `admin_users_page_1_sort_date${filterParam}`)
            .text(sort === 'status' ? "✅ Durum" : "Durum", `admin_users_page_1_sort_status${filterParam}`)
            .row();
        if (users.length === 0) {
            keyboard.row().text("⚠️ Bu filtrede kullanıcı yok", "noop");
        }
        else {
            users.forEach((user) => {
                const status = user.status === 'ACTIVE' ? '🟢' :
                    user.status === 'LIMITED' ? '🟡' :
                        user.status === 'EXPIRED' ? '🔴' : '⚫';
                const usedGB = (user.usedTrafficBytes / 1024 / 1024 / 1024).toFixed(1);
                const limitGB = (user.trafficLimitBytes / 1024 / 1024 / 1024).toFixed(0);
                keyboard.text(`${status} ${user.username} | ${usedGB}/${limitGB} GB`, `user_detail_${user.username}`).row();
            });
        }
        // Pagination buttons
        const paginationRow = [];
        if (page > 1) {
            paginationRow.push({ text: "⬅️ Önceki", callback_data: `admin_users_page_${page - 1}${sortParam}${filterParam}` });
        }
        if (page < totalPages) {
            paginationRow.push({ text: "Sonraki ➡️", callback_data: `admin_users_page_${page + 1}${sortParam}${filterParam}` });
        }
        if (paginationRow.length > 0) {
            keyboard.row(...paginationRow);
        }
        keyboard.row().text("🔙 Kullanıcı İşlemleri", "admin_user_ops");
        yield (0, error_middleware_1.safeEditMessageText)(ctx, message, {
            reply_markup: keyboard,
            parse_mode: "Markdown"
        });
    }
    catch (e) {
        logger_1.logger.error('Admin panel error (users):', e.message);
        yield (0, error_middleware_1.safeEditMessageText)(ctx, `❌ Hata: ${(e === null || e === void 0 ? void 0 : e.message) || 'Kullanıcı listesi alınamadı'}`);
    }
}));
// Admin Panel - Kullanıcı Arama
exports.bot.callbackQuery("admin_search", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    yield (0, error_middleware_1.safeAnswerCallback)(ctx);
    const adminId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
    if (adminId) {
        session_middleware_1.sessionManager.set(adminId, { action: 'search' });
    }
    const keyboard = new grammy_1.InlineKeyboard()
        .text("🔙 Kullanıcı İşlemleri", "admin_user_ops");
    yield (0, error_middleware_1.safeEditMessageText)(ctx, "🔍 *Kullanıcı Arama*\n\nKullanıcı adını yazın:\n\n_İptal için /cancel veya aşağıdaki butona tıklayın_", {
        parse_mode: "Markdown",
        reply_markup: keyboard
    });
}));
// Admin Panel - Kullanıcı Detayı (tıklanabilir listeden)
exports.bot.callbackQuery(/^user_detail_(.+)$/, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, error_middleware_1.safeAnswerCallback)(ctx);
    const match = ctx.match;
    if (!match)
        return;
    const username = match[1];
    try {
        const message = yield user_service_1.userService.getUserDetailsMessage(username);
        const keyboard = new grammy_1.InlineKeyboard()
            .text("⏰ Süre Uzat", `admin_extend_${username}`)
            .text("📊 Trafik Ekle", `admin_add_traffic_${username}`).row()
            .text("🔄 Cihaz Sıfırla", `admin_reset_devices_${username}`).row()
            .text("🔙 Kullanıcı Listesi", "admin_users");
        yield (0, error_middleware_1.safeEditMessageText)(ctx, message, {
            parse_mode: "Markdown",
            reply_markup: keyboard
        });
    }
    catch (e) {
        yield (0, error_middleware_1.safeEditMessageText)(ctx, `❌ Hata: ${(e === null || e === void 0 ? void 0 : e.message) || 'Kullanıcı bilgisi alınamadı'}`);
    }
}));
// Admin Panel - Süre Uzat (Seçim)
exports.bot.callbackQuery(/^admin_extend_(.+)$/, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    yield (0, error_middleware_1.safeAnswerCallback)(ctx);
    const username = ctx.match ? ctx.match[1] : null;
    if (!username)
        return;
    const adminId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
    if (adminId) {
        session_middleware_1.sessionManager.set(adminId, { action: 'extend_days', targetUser: username });
    }
    const keyboard = new grammy_1.InlineKeyboard()
        .text("🔙 İptal", `user_detail_${username}`);
    yield (0, error_middleware_1.safeEditMessageText)(ctx, `⏰ *Süre Uzatma: ${username}*\n\nKaç gün eklemek istiyorsunuz? (Örn: 30)\n\n_İptal için aşağıdaki butona tıklayın_`, { parse_mode: "Markdown", reply_markup: keyboard });
}));
// Admin Panel - Trafik Ekle (Seçim)
exports.bot.callbackQuery(/^admin_add_traffic_(.+)$/, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    yield (0, error_middleware_1.safeAnswerCallback)(ctx);
    const username = ctx.match ? ctx.match[1] : null;
    if (!username)
        return;
    const adminId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
    if (adminId) {
        session_middleware_1.sessionManager.set(adminId, { action: 'add_traffic', targetUser: username });
    }
    const keyboard = new grammy_1.InlineKeyboard()
        .text("🔙 İptal", `user_detail_${username}`);
    yield (0, error_middleware_1.safeEditMessageText)(ctx, `📊 *Trafik Ekleme: ${username}*\n\nKaç GB eklemek istiyorsunuz? (Örn: 10)\n\n_İptal için aşağıdaki butona tıklayın_`, { parse_mode: "Markdown", reply_markup: keyboard });
}));
// Admin Panel - Cihaz Sıfırla (İşlem)
exports.bot.callbackQuery(/^admin_reset_devices_(.+)$/, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const username = ctx.match ? ctx.match[1] : null;
    if (!username)
        return;
    try {
        yield (0, error_middleware_1.safeAnswerCallback)(ctx, "Cihazlar sıfırlanıyor...");
        yield user_service_1.userService.resetDevices(username);
        yield ctx.reply(`✅ *${username}* kullanıcısının tüm cihazları sıfırlandı!`, { parse_mode: "Markdown" });
        // Kullanıcı detayına geri dön
        try {
            const message = yield user_service_1.userService.getUserDetailsMessage(username);
            const keyboard = new grammy_1.InlineKeyboard()
                .text("⏰ Süre Uzat", `admin_extend_${username}`)
                .text("📊 Trafik Ekle", `admin_add_traffic_${username}`).row()
                .text("🔄 Cihaz Sıfırla", `admin_reset_devices_${username}`).row()
                .text("🔙 Kullanıcı Listesi", "admin_users");
            yield (0, error_middleware_1.safeEditMessageText)(ctx, message, {
                parse_mode: "Markdown",
                reply_markup: keyboard
            });
        }
        catch (e) {
            // Detay sayfasına dönemezsek sorun değil
        }
    }
    catch (e) {
        logger_1.logger.error(`Reset devices error for ${username}:`, e.message);
        yield ctx.reply(`❌ Hata: ${(e === null || e === void 0 ? void 0 : e.message) || 'Cihazlar sıfırlanamadı'}`);
    }
}));
// Admin Panel - Toplu Bildirim
exports.bot.callbackQuery("admin_broadcast", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    yield (0, error_middleware_1.safeAnswerCallback)(ctx);
    const adminId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
    if (adminId) {
        session_middleware_1.sessionManager.set(adminId, { action: 'broadcast' });
    }
    yield (0, error_middleware_1.safeEditMessageText)(ctx, "📢 *Toplu Bildirim*\n\nGöndermek istediğiniz mesajı yazın:\n\n_İptal için /cancel yazın_", { parse_mode: "Markdown" });
}));
// Admin Panel - İstatistikler
exports.bot.callbackQuery("admin_stats", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, error_middleware_1.safeAnswerCallback)(ctx);
    try {
        // 🎯 NEW: Use userService.getStatistics
        const stats = yield user_service_1.userService.getStatistics();
        const message = `📊 *Sistem İstatistikleri*\n\n` +
            `👥 Toplam Kullanıcı: ${stats.total}\n` +
            `🟢 Aktif: ${stats.active}\n` +
            `🟡 Limitli: ${stats.limited}\n` +
            `🔴 Süresi Dolmuş: ${stats.expired}\n\n` +
            `📈 Toplam Trafik: ${(stats.totalTraffic / 1024 / 1024 / 1024).toFixed(2)} GB\n` +
            `📊 Ortalama Trafik: ${(stats.avgTraffic / 1024 / 1024 / 1024).toFixed(2)} GB/kullanıcı`;
        yield (0, error_middleware_1.safeEditMessageText)(ctx, message, { parse_mode: "Markdown" });
    }
    catch (e) {
        // 🎯 NEW: Use logger
        logger_1.logger.error('Admin panel error (stats):', e.message);
        yield (0, error_middleware_1.safeEditMessageText)(ctx, `❌ Hata: ${(e === null || e === void 0 ? void 0 : e.message) || 'İstatistikler alınamadı'}`);
    }
}));
// Admin Panel - Kullanıcı İşlemleri
exports.bot.callbackQuery("admin_user_ops", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    yield (0, error_middleware_1.safeAnswerCallback)(ctx);
    // Aktif session varsa temizle (kullanıcı ara veya broadcast iptal)
    const adminId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
    if (adminId && session_middleware_1.sessionManager.has(adminId)) {
        session_middleware_1.sessionManager.delete(adminId);
    }
    const keyboard = new grammy_1.InlineKeyboard()
        .text("👥 Kullanıcı Listesi", "admin_users")
        .text("🔍 Kullanıcı Ara", "admin_search").row()
        .text("🔙 Geri", "admin_back");
    yield (0, error_middleware_1.safeEditMessageText)(ctx, "⚙️ *Kullanıcı İşlemleri*\n\nİşlem seçin:", { reply_markup: keyboard, parse_mode: "Markdown" });
}));
// Admin Panel - Sistem Durumu
exports.bot.callbackQuery("admin_status", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, error_middleware_1.safeAnswerCallback)(ctx);
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
    yield (0, error_middleware_1.safeEditMessageText)(ctx, message, { parse_mode: "Markdown" });
}));
// Admin Panel - Sistem Logları
exports.bot.callbackQuery("admin_logs", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, error_middleware_1.safeAnswerCallback)(ctx);
    // Not: Production'da log dosyası okuma gerekir
    // Şimdilik basit bilgi gösterelim
    const message = `📝 *Sistem Logları*\n\n` +
        `Bu özellik geliştirme aşamasındadır.\n\n` +
        `Log'ları görmek için:\n` +
        `• Dokploy: Logs sekmesi\n` +
        `• PM2: \`pm2 logs telegram-bot\`\n` +
        `• Docker: \`docker logs -f container_name\``;
    yield (0, error_middleware_1.safeEditMessageText)(ctx, message, { parse_mode: "Markdown" });
}));
// Admin Panel - Geri butonu
exports.bot.callbackQuery("admin_back", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, error_middleware_1.safeAnswerCallback)(ctx);
    const keyboard = new grammy_1.InlineKeyboard()
        .text("⚙️ Kullanıcı İşlemleri", "admin_user_ops")
        .text("📢 Toplu Bildirim", "admin_broadcast").row()
        .text("📊 İstatistikler", "admin_stats")
        .text("📝 Sistem Logları", "admin_logs").row()
        .text("💾 Sistem Durumu", "admin_status");
    yield (0, error_middleware_1.safeEditMessageText)(ctx, "👨‍💼 *Admin Paneli*\n\nYönetim fonksiyonlarını seçin:", { reply_markup: keyboard, parse_mode: "Markdown" });
}));
// "Try for Free" düğmesine basıldığında (orijinal callback)
exports.bot.callbackQuery("try_free", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield handleTryFree(ctx);
}));
// "Satın Al" düğmesine basıldığında
exports.bot.callbackQuery("buy_subscription", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, error_middleware_1.safeAnswerCallback)(ctx, "Çok yakında!");
}));
// "Hesabım" düğmesine basıldığında
exports.bot.callbackQuery("my_account", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const telegramId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
    if (!telegramId) {
        yield (0, error_middleware_1.safeAnswerCallback)(ctx, "Hata!");
        yield ctx.reply("Telegram ID'niz alınamadı. Lütfen tekrar deneyin.");
        return;
    }
    try {
        yield (0, error_middleware_1.safeAnswerCallback)(ctx, "Hesap bilgileriniz getiriliyor...");
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
        var _a, _b;
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
                    console.log(`📱 Commands: /start, /admin, /help, /app, /ping`);
                    console.log(`⚡ RemnaWave webhook: POST /endpoint`);
                    console.log(`🔍 Long polling aktif - mesajları dinliyorum...`);
                },
                drop_pending_updates: true, // Eski mesajları atla
                allowed_updates: ["message", "callback_query"] // Sadece mesaj ve callback al
            });
        }
        catch (error) {
            console.error("❌ FATAL: Bot başlatılamadı!");
            console.error("Hata:", error === null || error === void 0 ? void 0 : error.message);
            console.error("Stack:", error === null || error === void 0 ? void 0 : error.stack);
            // 409 hatası özel kontrolü
            if (((_a = error === null || error === void 0 ? void 0 : error.message) === null || _a === void 0 ? void 0 : _a.includes("409")) || ((_b = error === null || error === void 0 ? void 0 : error.message) === null || _b === void 0 ? void 0 : _b.includes("Conflict"))) {
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
