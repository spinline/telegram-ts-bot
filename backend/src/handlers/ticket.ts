import { Bot, Context, InlineKeyboard } from "grammy";
import { ticketService, TicketStatus } from "../services/ticket.service";
import { sessionManager } from "../middlewares/session.middleware";
import { safeEditMessageText, safeAnswerCallback } from "../middlewares/error.middleware";

export function registerTicketHandlers(bot: Bot<Context>) {

  // Menu: Support
  bot.callbackQuery("menu_support", async (ctx) => {
    await safeAnswerCallback(ctx);
    const keyboard = new InlineKeyboard()
      .text("🎫 Create Ticket", "create_ticket").row()
      .text("📂 My Tickets", "my_tickets").row()
      .text("🔙 Back", "start"); // Assuming start or main menu

    await safeEditMessageText(ctx, "🛠 **Support Center**\n\nHow can we help you today?", {
      parse_mode: "Markdown",
      reply_markup: keyboard
    });
  });

  // Create Ticket: Ask for Title
  bot.callbackQuery("create_ticket", async (ctx) => {
    await safeAnswerCallback(ctx);
    const userId = ctx.from?.id;
    if (!userId) return;

    if (await ticketService.hasActiveTicket(userId)) {
      await ctx.reply("⚠️ You already have an open ticket. Please close it first.");
      return;
    }

    sessionManager.set(userId, { action: 'ticket_title' });
    
    const keyboard = new InlineKeyboard().text("🔙 Cancel", "menu_support");
    
    await safeEditMessageText(ctx, "📝 **New Ticket**\n\nPlease enter a **title** for your ticket:", {
      parse_mode: "Markdown",
      reply_markup: keyboard
    });
  });

  // My Tickets (Open)
  bot.callbackQuery(/^my_tickets(_p_(\d+))?$/, async (ctx) => {
    await safeAnswerCallback(ctx);
    const userId = ctx.from?.id;
    if (!userId) return;

    const page = ctx.match && ctx.match[2] ? parseInt(ctx.match[2]) : 1;
    const limit = 5;
    const statuses = [TicketStatus.OPEN, TicketStatus.ANSWERED, TicketStatus.PENDING];
    
    const tickets = await ticketService.getUserTickets(userId, statuses, page, limit);
    const total = await ticketService.countUserTickets(userId, statuses);
    const totalPages = Math.ceil(total / limit);

    const keyboard = new InlineKeyboard();
    
    if (tickets.length === 0) {
      keyboard.text("🎫 Create Ticket", "create_ticket").row();
    } else {
      tickets.forEach(t => {
        const emoji = t.status === TicketStatus.ANSWERED ? '🟢' : '🟡';
        keyboard.text(`${emoji} #${t.id} ${t.title}`, `view_ticket_${t.id}`).row();
      });
    }

    // Pagination
    const navRow = [];
    if (page > 1) navRow.push({ text: "⬅️", callback_data: `my_tickets_p_${page - 1}` });
    if (page < totalPages) navRow.push({ text: "➡️", callback_data: `my_tickets_p_${page + 1}` });
    if (navRow.length > 0) keyboard.row(...navRow);

    keyboard.row().text("🔒 Closed Tickets", "my_tickets_closed");
    keyboard.row().text("🔙 Back", "menu_support");

    await safeEditMessageText(ctx, `📂 **My Tickets** (Page ${page}/${totalPages || 1})`, {
      parse_mode: "Markdown",
      reply_markup: keyboard
    });
  });

  // My Tickets (Closed)
  bot.callbackQuery(/^my_tickets_closed(_p_(\d+))?$/, async (ctx) => {
    await safeAnswerCallback(ctx);
    const userId = ctx.from?.id;
    if (!userId) return;

    const page = ctx.match && ctx.match[2] ? parseInt(ctx.match[2]) : 1;
    const limit = 5;
    const statuses = [TicketStatus.CLOSED];
    
    const tickets = await ticketService.getUserTickets(userId, statuses, page, limit);
    const total = await ticketService.countUserTickets(userId, statuses);
    const totalPages = Math.ceil(total / limit);

    const keyboard = new InlineKeyboard();
    
    tickets.forEach(t => {
      keyboard.text(`🔴 #${t.id} ${t.title}`, `view_ticket_${t.id}`).row();
    });

    // Pagination
    const navRow = [];
    if (page > 1) navRow.push({ text: "⬅️", callback_data: `my_tickets_closed_p_${page - 1}` });
    if (page < totalPages) navRow.push({ text: "➡️", callback_data: `my_tickets_closed_p_${page + 1}` });
    if (navRow.length > 0) keyboard.row(...navRow);

    keyboard.row().text("📂 Open Tickets", "my_tickets");
    keyboard.row().text("🔙 Back", "menu_support");

    await safeEditMessageText(ctx, `🔒 **Closed Tickets** (Page ${page}/${totalPages || 1})`, {
      parse_mode: "Markdown",
      reply_markup: keyboard
    });
  });

  // View Ticket
  bot.callbackQuery(/^view_ticket_(\d+)$/, async (ctx) => {
    await safeAnswerCallback(ctx);
    const ticketId = parseInt(ctx.match[1]);
    const ticket = await ticketService.getTicketById(ticketId);

    if (!ticket) {
      await ctx.reply("❌ Ticket not found.");
      return;
    }

    let message = `🎫 **Ticket #${ticket.id}**\n`;
    message += `📝 **Title:** ${ticket.title}\n`;
    message += `📊 **Status:** ${ticket.status}\n`;
    message += `📅 **Date:** ${ticket.createdAt.toLocaleDateString()}\n\n`;

    ticket.messages.forEach(msg => {
      const sender = msg.isUserMessage ? "👤 You" : "🛠 Support";
      message += `**${sender}:**\n${msg.messageText}\n\n`;
    });

    const keyboard = new InlineKeyboard();
    if (ticket.status !== TicketStatus.CLOSED) {
      keyboard.text("💬 Reply", `reply_ticket_${ticket.id}`).text("🔒 Close", `close_ticket_${ticket.id}`).row();
    }
    keyboard.text("🔙 Back", "my_tickets");

    await safeEditMessageText(ctx, message, {
      parse_mode: "Markdown",
      reply_markup: keyboard
    });
  });

  // Reply Ticket: Ask for Message
  bot.callbackQuery(/^reply_ticket_(\d+)$/, async (ctx) => {
    await safeAnswerCallback(ctx);
    const ticketId = parseInt(ctx.match[1]);
    const userId = ctx.from?.id;
    if (!userId) return;

    sessionManager.set(userId, { 
      action: 'ticket_reply', 
      ticketData: { ticketId } 
    });

    const keyboard = new InlineKeyboard().text("🔙 Cancel", `view_ticket_${ticketId}`);

    await safeEditMessageText(ctx, "💬 **Reply to Ticket**\n\nPlease enter your message:", {
      parse_mode: "Markdown",
      reply_markup: keyboard
    });
  });

  // Close Ticket
  bot.callbackQuery(/^close_ticket_(\d+)$/, async (ctx) => {
    await safeAnswerCallback(ctx);
    const ticketId = parseInt(ctx.match[1]);
    
    await ticketService.closeTicket(ticketId);
    
    await ctx.reply("✅ Ticket closed.");
    
    const keyboard = new InlineKeyboard().text("🔙 Back to Tickets", "my_tickets");
    await ctx.reply("Ticket has been closed.", { reply_markup: keyboard });
  });
}

// Message Handler Logic (to be called from index.ts)
export async function handleTicketMessage(ctx: Context, next: () => Promise<void>) {
  const userId = ctx.from?.id;
  const text = ctx.message?.text;
  
  if (!userId || !text) return next();

  const session = sessionManager.get(userId);
  if (!session) return next();

  if (session.action === 'ticket_title') {
    if (text.length < 5) {
      await ctx.reply("❌ Title is too short. Please try again.");
      return;
    }
    
    sessionManager.set(userId, { 
      action: 'ticket_message', 
      ticketData: { title: text } 
    });
    
    await ctx.reply("📝 **Description**\n\nPlease describe your issue:", { parse_mode: "Markdown" });
    return;
  }

  if (session.action === 'ticket_message') {
    const title = session.ticketData?.title;
    if (!title) {
      sessionManager.delete(userId);
      return next();
    }

    const ticket = await ticketService.createTicket(userId, title, text);
    
    await ctx.reply(`✅ **Ticket #${ticket.id} Created!**\n\nWe will reply as soon as possible.`);
    sessionManager.delete(userId);
    return;
  }

  if (session.action === 'ticket_reply') {
    const ticketId = session.ticketData?.ticketId;
    if (!ticketId) {
      sessionManager.delete(userId);
      return next();
    }

    await ticketService.addMessage(ticketId, userId, text, true);
    
    await ctx.reply("✅ Reply sent!");
    sessionManager.delete(userId);
    return;
  }

  return next();
}
