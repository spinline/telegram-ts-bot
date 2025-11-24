/**
 * Account related types
 */

export interface HwidDevice {
  hwid: string;
  userUuid: string;
  platform?: string | null;
  osVersion?: string | null;
  deviceModel?: string | null;
  userAgent?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccountResponse {
  uuid: string;
  username: string;
  status: 'ACTIVE' | 'LIMITED' | 'EXPIRED' | 'DISABLED';
  usedTrafficBytes: number;
  trafficLimitBytes: number;
  expireAt: string;
  onlineAt?: string | null;
  tag?: string;
  telegramId?: string;
  email?: string;
  createdAt: string;
  manageUrl?: string;
  subscriptionUrl?: string;
  hwidDeviceLimit?: number | null;
  happ?: {
    cryptoLink: string;
  };
  lastConnectedNode?: {
    nodeName?: string;
    countryCode?: string;
    connectedAt?: string | null;
  } | null;
  hwid?: {
    total: number;
    devices: HwidDevice[];
  };
}

export type OnlineStatus = 'online' | 'offline' | null;

