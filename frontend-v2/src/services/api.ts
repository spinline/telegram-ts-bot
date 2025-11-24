import axios from 'axios';
import type { AccountResponse } from '../types/account';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Telegram InitData to headers
api.interceptors.request.use((config) => {
  const initData = (window as any).Telegram?.WebApp?.initData;
  console.log('API Request Interceptor:', { url: config.url, initDataPresent: !!initData });
  if (initData) {
    config.headers['X-Telegram-Init-Data'] = initData;
  }
  return config;
});

export const accountService = {
  getAccount: async (): Promise<AccountResponse> => {
    const { data } = await api.get<AccountResponse>('/account');
    return data;
  },

  deleteDevice: async (deviceId: string): Promise<void> => {
    await api.delete('/hwid/device', { data: { deviceId } });
  }
};

export const ticketService = {
  getTickets: async () => {
    const { data } = await api.get('/tickets');
    return data;
  },

  createTicket: async (ticket: { title: string; message: string }) => {
    const { data } = await api.post('/tickets', ticket);
    return data;
  },

  getTicket: async (id: number) => {
    const { data } = await api.get(`/tickets/${id}`);
    return data;
  },

  sendMessage: async (ticketId: number, message: string) => {
    const { data } = await api.post(`/tickets/${ticketId}/messages`, { message });
    return data;
  }
};
