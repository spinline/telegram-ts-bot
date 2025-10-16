import "dotenv/config";
import { Bot, Context, InlineKeyboard } from "grammy";
import axios from "axios";
const YAML = require("yamljs");
import path from "path";
import fs from "fs";
import { createUser, getUserByUsername, getUserByTelegramId } from "./api";

// Bot token'ınızı buraya girin
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

// Başlangıç komutu için klavye oluştur
const startKeyboard = new InlineKeyboard()
  .text("🚀 Try for Free", "try_free")
  .text("💳 Satın Al", "buy_subscription")
  .row()
  .text("👤 Hesabım", "my_account")
  .text("📱 Mini App", "open_mini_app");

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
  const miniAppUrl = process.env.MINI_APP_URL || "";
  if (!miniAppUrl) {
    return ctx.reply("Mini App şu anda mevcut değil.");
  }
  await ctx.reply("Aşağıdaki düğmeye tıklayarak Mini App'i açabilirsiniz:", {
    reply_markup: new InlineKeyboard().webApp("📱 Uygulamayı Aç", miniAppUrl),
  });
});

bot.command("help", (ctx) => ctx.reply("Size nasıl yardımcı olabilirim?"));

// Örnek bir HTTP isteği komutu
bot.command("fetchdata", async (ctx) => {
  try {
    const response = await axios.get("https://jsonplaceholder.typicode.com/todos/1");
    ctx.reply(`Veri çekildi: ${JSON.stringify(response.data)}`);
  } catch (error) {
    ctx.reply("Veri çekilirken bir hata oluştu.");
  }
});

// "Open Mini App" düğmesine basıldığında
bot.callbackQuery("open_mini_app", async (ctx) => {
  const miniAppUrl = process.env.MINI_APP_URL || "";
  if (!miniAppUrl) {
    await ctx.answerCallbackQuery({ text: "Mini App şu anda mevcut değil.", show_alert: true });
    return;
  }
  await ctx.reply("Aşağıdaki düğmeye tıklayarak Mini App'i açabilirsiniz:", {
    reply_markup: new InlineKeyboard().webApp("📱 Uygulamayı Aç", miniAppUrl),
  });
});

// OpenAPI dokümanını gösterme komutu (basit bir örnek)
bot.command("openapi", (ctx) => {
  if (openApiDocument) {
    ctx.reply("OpenAPI dokümanı yüklendi. Detaylar konsolda.");
    // Gerçek bir botta bu kadar büyük bir çıktıyı doğrudan göndermeyin.
    // Bunun yerine belirli kısımlarını veya özetini gönderebilirsiniz.
  } else {
    ctx.reply("OpenAPI dokümanı yüklenemedi.");
  }
});

// "Try for Free" düğmesine basıldığında
bot.callbackQuery("try_free", async (ctx) => {
  const telegramId = ctx.from?.id;
  const username = ctx.from?.username;

  if (!telegramId) {
    await ctx.answerCallbackQuery("Hata!");
    await ctx.reply("Telegram ID'niz alınamadı. Lütfen tekrar deneyin.");
    return;
  }

  if (!username) {
    await ctx.answerCallbackQuery();
    await ctx.reply("Kayıt olabilmek için bir Telegram kullanıcı adınızın olması gerekmektedir.");
    return;
  }

  try {
    // Kullanıcının zaten var olup olmadığını Telegram ID ile kontrol et
    const existingUser = await getUserByTelegramId(telegramId);
    if (existingUser) {
      await ctx.answerCallbackQuery();
      await ctx.reply(`Bu Telegram hesabı ile zaten bir kullanıcı mevcut: <code>${existingUser.username}</code>\n\nHesap durumunuzu kontrol etmek için ana menüdeki "Hesap Durumu" düğmesini kullanabilirsiniz.`, { parse_mode: "HTML" });
      return;
    }

    await ctx.answerCallbackQuery("Deneme hesabınız oluşturuluyor...");

    const squadUuid = "bb0af2ad-9412-4804-931c-8318f29044e2";

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
    await ctx.answerCallbackQuery("Hata!");
    await ctx.reply(`Kullanıcı oluşturulurken bir hata oluştu: ${error.message}`);
  }
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


async function startBot() {
  bot.start();
  console.log("Bot started!");
}

startBot();
