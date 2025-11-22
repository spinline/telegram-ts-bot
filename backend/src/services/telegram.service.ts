import { Bot, InlineKeyboard } from "grammy";
import { env } from "../config/env";

/**
 * Telegram Service
 * Handles all Telegram bot operations
 */
class TelegramService {
  private bot: Bot;

  constructor() {
    this.bot = new Bot(env.BOT_TOKEN);
  }

  getBot(): Bot {
    return this.bot;
  }

  /**
   * Send message to user
   */
  async sendMessage(chatId: number, text: string, options?: any) {
    return await this.bot.api.sendMessage(chatId, text, options);
  }

  /**
   * Send message with inline keyboard
   */
  async sendMessageWithKeyboard(
    chatId: number,
    text: string,
    keyboard: InlineKeyboard,
    parseMode: "Markdown" | "HTML" = "Markdown"
  ) {
    return await this.bot.api.sendMessage(chatId, text, {
      reply_markup: keyboard,
      parse_mode: parseMode
    });
  }

  /**
   * Broadcast message to multiple users
   */
  async broadcast(
    userIds: number[],
    message: string,
    onProgress?: (sent: number, failed: number) => void
  ) {
    let sent = 0;
    let failed = 0;

    for (const userId of userIds) {
      try {
        await this.sendMessage(userId, message);
        sent++;
        await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit
      } catch (e: any) {
        // Ignore "chat not found" errors
        if (!e?.message?.includes('chat not found')) {
          console.warn(`⚠️ Broadcast error for user ${userId}:`, e?.message);
        }
        failed++;
      }

      if (onProgress) {
        onProgress(sent, failed);
      }
    }

    return { sent, failed };
  }

  /**
   * Start bot with long polling
   */
  async start(onStart?: (botInfo: any) => void) {
    await this.bot.start({
      onStart: (botInfo) => {
        if (onStart) {
          onStart(botInfo);
        }
      },
      drop_pending_updates: true,
      allowed_updates: ["message", "callback_query"]
    });
  }

  /**
   * Stop bot
   */
  async stop() {
    await this.bot.stop();
  }
}

export const telegramService = new TelegramService();
export const bot = telegramService.getBot();

