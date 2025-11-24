/**
 * API Service
 * Handles all API calls to backend
 */

import type { AccountResponse } from '../types/account';

const getBackendOrigin = (): string => {
  const rawOrigin = import.meta.env.VITE_BACKEND_ORIGIN || '';
  return rawOrigin.replace(/\/+$/, '');
};

/**
 * Fetch account data
 */
export const fetchAccount = async (initData: string): Promise<AccountResponse> => {
  const apiOrigin = getBackendOrigin();
  const res = await fetch(`${apiOrigin}/api/account`, {
    headers: { 'x-telegram-init-data': initData },
  });

  if (!res.ok) {
    throw new Error(`Hesap bilgileri alınamadı: ${res.status}`);
  }

  return await res.json();
};

/**
 * Delete HWID device
 */
export const deleteHwidDevice = async (
  deviceId: string,
  initData: string
): Promise<void> => {
  const apiOrigin = getBackendOrigin();
  const res = await fetch(`${apiOrigin}/api/hwid/device`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-init-data': initData,
    },
    body: JSON.stringify({ deviceId }),
  });

  if (!res.ok) {
    throw new Error('Cihaz silinemedi');
  }
};

/**
 * Open Happ deeplink
 */
export const openHappDeeplink = async (
  cryptoLink: string,
  initData: string
): Promise<{ success: boolean; url?: string }> => {
  const apiOrigin = getBackendOrigin();
  const res = await fetch(`${apiOrigin}/api/happ/open`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-init-data': initData,
    },
    body: JSON.stringify({ cryptoLink }),
  });

  if (!res.ok) {
    throw new Error('Happ linki oluşturulamadı');
  }

  return await res.json();
};

