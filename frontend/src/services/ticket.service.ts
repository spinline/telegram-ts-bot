import axios, { type InternalAxiosRequestConfig } from 'axios';
import { telegramService } from './telegram';

const API_BASE_URL = import.meta.env.VITE_BACKEND_ORIGIN || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 seconds timeout
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const initData = telegramService.getInitData();
  if (initData) {
    config.headers = config.headers || {};
    config.headers.set('x-telegram-init-data', initData);
  }
  return config;
});

export interface Ticket {
  id: number;
  userId: number;
  title: string;
  status: 'OPEN' | 'ANSWERED' | 'CLOSED' | 'PENDING';
  createdAt: string;
  updatedAt: string;
  messages?: TicketMessage[];
}

export interface TicketMessage {
  id: number;
  ticketId: number;
  userId: number;
  messageText: string;
  isUserMessage: boolean;
  createdAt: string;
}

export interface TicketsResponse {
  tickets: Ticket[];
  total?: number;
  page?: number;
}

export const ticketService = {
  getTickets: async (status: string = 'OPEN', page: number = 1): Promise<TicketsResponse> => {
    const response = await api.get(`/api/tickets?status=${status}&page=${page}`);
    return response.data;
  },

  getTicketById: async (id: number): Promise<Ticket> => {
    const response = await api.get(`/api/tickets/${id}`);
    return response.data;
  },

  createTicket: async (title: string, message: string): Promise<Ticket> => {
    const response = await api.post('/api/tickets', { title, message });
    return response.data;
  },

  replyTicket: async (id: number, message: string): Promise<TicketMessage> => {
    const response = await api.post(`/api/tickets/${id}/reply`, { message });
    return response.data;
  },

  closeTicket: async (id: number): Promise<Ticket> => {
    const response = await api.post(`/api/tickets/${id}/close`);
    return response.data;
  }
};
