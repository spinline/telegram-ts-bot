import { Context, InlineKeyboard } from "grammy";
import { env } from "../../config/env";

/**
 * /start command handler
 */
export async function startHandler(ctx: Context) {
  const welcomeMessage = `
Hoş geldiniz! Bu bot ile VPN hizmetinize erişebilirsiniz.

Lütfen aşağıdaki seçeneklerden birini seçin:
`;

  const keyboard = new InlineKeyboard()
    .text("🚀 Try for Free", "try_free")
    .text("💳 Satın Al", "buy_subscription")
    .row()
    .text("👤 Hesabım", "my_account")
    .webApp("📱 Mini App", env.MINI_APP_URL);

  await ctx.reply(welcomeMessage, {
    reply_markup: keyboard,
  });
}

/**
 * /help command handler
 */
export async function helpHandler(ctx: Context) {
  await ctx.reply("Size nasıl yardımcı olabilirim?");
}

/**
 * /app command handler
 */
export async function appHandler(ctx: Context) {
  if (!env.MINI_APP_URL) {
    return ctx.reply("Mini App URL'i ayarlanmamış. Lütfen yöneticinizle iletişime geçin.");
  }

  await ctx.reply("Aşağıdaki düğmeye tıklayarak Mini App'i açabilirsiniz:", {
    reply_markup: new InlineKeyboard().webApp("📱 Uygulamayı Aç", env.MINI_APP_URL),
  });
}

