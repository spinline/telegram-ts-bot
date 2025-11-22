/**
 * Account related types
 */

export interface AccountResponse {
  uuid: string;
  username: string;
  status: 'ACTIVE' | 'LIMITED' | 'EXPIRED' | 'DISABLED';
  usedTrafficBytes: number;
  trafficLimitBytes: number;
  expireAt: string;
  onlineAt?: string;
  tag?: string;
  telegramId?: string;
  email?: string;
  createdAt: string;
  happ?: {
    cryptoLink?: string;
  };
  lastConnectedNode?: {
    nodeName: string;
    countryCode: string;
    connectedAt: string;
  };
  hwidDevices?: HwidDevice[];
}

export interface HwidDevice {
  id: string;
  deviceId: string;
  deviceName?: string;
  platform?: string;
  createdAt: string;
  lastSeenAt: string;
}

export type OnlineStatus = 'online' | 'offline' | null;

