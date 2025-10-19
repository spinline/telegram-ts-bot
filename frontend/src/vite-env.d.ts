/// <reference types="vite/client" />

interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface TelegramWebAppInitData {
  query_id?: string;
  user?: TelegramWebAppUser;
  auth_date?: number;
  hash?: string;
}

type TelegramColorScheme = 'light' | 'dark';

type TelegramEventHandler = () => void;

type TelegramEventName = 'themeChanged' | string;

interface TelegramWebApp {
  initData?: string;
  initDataUnsafe?: TelegramWebAppInitData;
  colorScheme?: TelegramColorScheme;
  ready: () => void;
  expand?: () => void;
  close?: () => void;
  onEvent?: (eventType: TelegramEventName, callback: TelegramEventHandler) => void;
  offEvent?: (eventType: TelegramEventName, callback: TelegramEventHandler) => void;
  openLink?: (url: string) => void;
  openTelegramLink?: (url: string) => void;
}

declare interface Window {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
}
