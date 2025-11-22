import { Context } from "grammy";
import { sessionManager } from "../../middlewares/session.middleware";
import { userService } from "../../services/user.service";
import { notificationService } from "../../services/notification.service";
import { logger } from "../../utils/logger";

/**
 * Admin message handler - session tabanlı işlemler
 * Kullanıcı arama ve broadcast için
 */
export async function adminMessageHandler(ctx: Context, next: () => Promise<void>) {
  const userId = ctx.from?.id;
  const text = ctx.message?.text;

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
    if (session.action === 'search') {
      await handleUserSearch(ctx, text.trim(), userId);
    } else if (session.action === 'broadcast') {
      await handleBroadcast(ctx, text, userId);
    }
  } catch (e: any) {
    logger.error('Admin session error:', e);
    await ctx.reply(`❌ İşlem sırasında hata oluştu: ${e?.message}`);
    sessionManager.delete(userId);
  }
}

/**
 * Kullanıcı arama işlemi
 */
async function handleUserSearch(ctx: Context, username: string, userId: number) {
  try {
    const user = await userService.getUserByUsername(username);

    if (!user) {
      await ctx.reply(`❌ Kullanıcı bulunamadı: ${username}`);
      sessionManager.delete(userId);
      return;
    }

    const message = userService.formatUserDetails(user);

    await ctx.reply(message, { parse_mode: "Markdown" });
    sessionManager.delete(userId);

  } catch (e: any) {
    await ctx.reply(`❌ Hata: ${e?.message || 'Bilinmeyen hata'}`);
    sessionManager.delete(userId);
  }
}

/**
 * Toplu bildirim işlemi
 */
async function handleBroadcast(ctx: Context, message: string, userId: number) {
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
}

