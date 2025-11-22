import { Context, NextFunction } from "grammy";
import { env } from "../config/env";

/**
 * Admin authentication middleware
 * Checks if user is authorized admin
 */
export async function adminAuthMiddleware(ctx: Context, next: NextFunction) {
  const telegramId = ctx.from?.id;

  if (!telegramId) {
    await ctx.reply("⛔ Kimlik doğrulanamadı.");
    return;
  }

  const isAdmin = env.ADMIN_TELEGRAM_IDS.includes(telegramId);

  if (!isAdmin) {
    await ctx.reply("⛔ Bu komutu kullanma yetkiniz yok.");
    return;
  }

  // User is admin, continue
  await next();
}

/**
 * Check if callback query is from admin
 */
export function isAdmin(telegramId: number): boolean {
  return env.ADMIN_TELEGRAM_IDS.includes(telegramId);
}

