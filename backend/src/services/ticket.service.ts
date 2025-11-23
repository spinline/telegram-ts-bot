import { PrismaClient, Ticket, TicketMessage } from '@prisma/client';

const prisma = new PrismaClient();

export enum TicketStatus {
  OPEN = 'OPEN',
  ANSWERED = 'ANSWERED',
  CLOSED = 'CLOSED',
  PENDING = 'PENDING'
}

export class TicketService {
  
  async createTicket(userId: number, title: string, message: string, mediaType?: string, mediaFileId?: string) {
    try {
      console.log('Creating ticket in DB:', { userId, title, messageLength: message.length });
      const ticket = await prisma.ticket.create({
        data: {
          userId: BigInt(userId),
          title,
          status: TicketStatus.OPEN,
          messages: {
            create: {
              userId: BigInt(userId),
              messageText: message,
              isUserMessage: true,
              mediaType,
              mediaFileId
            }
          }
        },
        include: {
          messages: true
        }
      });
      console.log('Ticket created successfully:', ticket.id);
      return {
        ...ticket,
        userId: Number(ticket.userId),
        messages: ticket.messages?.map(m => ({
          ...m,
          userId: Number(m.userId),
          ticketId: Number(m.ticketId)
        }))
      };
    } catch (error: any) {
      console.error('Database error in createTicket:', error);
      throw error;
    }
  }

  async getUserTickets(userId: number, statuses: string[], page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const tickets = await prisma.ticket.findMany({
      where: {
        userId: BigInt(userId),
        status: { in: statuses }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });
    
    return tickets.map(t => ({
      ...t,
      userId: Number(t.userId) // Convert BigInt to Number for JS
    }));
  }

  async countUserTickets(userId: number, statuses: string[]) {
    return await prisma.ticket.count({
      where: {
        userId: BigInt(userId),
        status: { in: statuses }
      }
    });
  }

  async getTickets(statuses: string[], page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const tickets = await prisma.ticket.findMany({
      where: {
        status: { in: statuses }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });
    
    return tickets.map(t => ({
      ...t,
      userId: Number(t.userId)
    }));
  }

  async countTickets(statuses: string[]) {
    return await prisma.ticket.count({
      where: {
        status: { in: statuses }
      }
    });
  }

  async getTicketById(ticketId: number) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });
    
    if (!ticket) return null;

    return {
      ...ticket,
      userId: Number(ticket.userId),
      messages: ticket.messages.map(m => ({
        ...m,
        userId: Number(m.userId)
      }))
    };
  }

  async addMessage(ticketId: number, userId: number, text: string, isUserMessage: boolean, mediaType?: string, mediaFileId?: string) {
    // Update ticket status
    const newStatus = isUserMessage ? TicketStatus.OPEN : TicketStatus.ANSWERED;
    
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { 
        status: newStatus,
        updatedAt: new Date()
      }
    });

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId,
        userId: BigInt(userId),
        messageText: text,
        isUserMessage,
        mediaType,
        mediaFileId
      }
    });

    return {
      ...message,
      userId: Number(message.userId),
      ticketId: Number(message.ticketId)
    };
  }

  async closeTicket(ticketId: number) {
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: TicketStatus.CLOSED }
    });
    
    return {
      ...ticket,
      userId: Number(ticket.userId)
    };
  }

  async hasActiveTicket(userId: number) {
    const count = await prisma.ticket.count({
      where: {
        userId: BigInt(userId),
        status: { not: TicketStatus.CLOSED }
      }
    });
    return count > 0;
  }
}

export const ticketService = new TicketService();
