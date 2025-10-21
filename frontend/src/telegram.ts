export type TelegramWebApp = {
  initDataUnsafe?: { user?: { first_name?: string; username?: string } };
  initData?: string;
  ready?: () => void;
  colorScheme?: 'light' | 'dark';
  openLink?: (url: string) => void;
  showPopup?: (config: any, callback?: (id: string) => void) => void;
  HapticFeedback?: {
    selectionChanged?: () => void;
    impactOccurred?: (style: 'soft' | 'light' | 'medium' | 'heavy' | 'rigid') => void;
  };
};

export const getTelegramWebApp = (): TelegramWebApp | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const telegram = (window as typeof window & { Telegram?: { WebApp?: TelegramWebApp } })['Telegram'];
  return telegram?.WebApp;
};
