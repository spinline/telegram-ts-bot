import axios from 'axios';
import type { AccountResponse } from '../types/account';

const BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:3001';
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Telegram InitData to headers
api.interceptors.request.use((config) => {
  const initData = (window as any).Telegram?.WebApp?.initData;
  console.log('API Request Interceptor:', {
    url: config.url, initDataPreview: initData ? `${initData.substring(0, 20)}...` : 'N/A'
  });

  if (initData) {
    // Debug: Check auth_date
    try {
      const params = new URLSearchParams(initData);
      const authDate = params.get('auth_date');
      if (authDate) {
        const date = new Date(parseInt(authDate) * 1000);
        console.log('InitData Auth Date:', date.toLocaleString(), 'Timestamp:', authDate);

        // Check if expired (Telegram allows 24h usually, but good to know)
        const now = Date.now() / 1000;
        const diff = now - parseInt(authDate);
        console.log('Auth Date Age (seconds):', diff);
      }
    } catch (e) {
      console.error('Error parsing initData for debug:', e);
    }

    // Use lowercase header to match original implementation exactly
    config.headers['x-telegram-init-data'] = initData;
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
    // Backend returns { tickets: [], total: number, ... }
    return data.tickets;
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
