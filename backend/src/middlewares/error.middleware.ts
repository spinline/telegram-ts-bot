import { Context } from "grammy";

/**
 * Grammy error handler middleware
 * Handles all bot errors gracefully
 */
export function errorHandler(err: any) {
  const ctx = err.ctx as Context;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const error = err.error;

  if (error instanceof Error) {
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);

    // Callback query timeout - normal, ignore
    if (error.message.includes("query is too old")) {
      console.warn("⚠️ Callback query timeout (normal, ignored)");
      return;
    }

    // Bot blocked - user blocked the bot
    if (error.message.includes("bot was blocked")) {
      console.warn("⚠️ User blocked the bot");
      return;
    }
  }

  console.error("Full error:", error);
}

/**
 * Safe callback query answer
 * Prevents timeout errors from crashing the bot
 */
export async function safeAnswerCallback(ctx: any, text?: string) {
  try {
    if (text) {
      await ctx.answerCallbackQuery(text);
    } else {
      await ctx.answerCallbackQuery();
    }
  } catch (e: any) {
    // Timeout error - normal, log and continue
    if (e.message?.includes("query is too old") || e.message?.includes("query ID is invalid")) {
      console.warn("⚠️ Callback query timeout (ignored)");
      return;
    }
    // Other errors
    console.error("❌ answerCallbackQuery error:", e.message);
  }
}

