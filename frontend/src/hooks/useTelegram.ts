/**
 * useTelegram Hook
 * Access Telegram WebApp functionality
 */

import { useEffect } from 'react';
import { telegramService } from '../services/telegram';

export const useTelegram = () => {
  useEffect(() => {
    telegramService.ready();
  }, []);

  return {
    webApp: telegramService.getWebApp(),
    user: telegramService.getUser(),
    initData: telegramService.getInitData(),
    close: () => telegramService.close(),
    expand: () => telegramService.expand(),
    haptic: (style?: 'light' | 'medium' | 'heavy') => telegramService.hapticFeedback(style),
    setHeaderColor: (color: string) => telegramService.setHeaderColor(color),
    setBackgroundColor: (color: string) => telegramService.setBackgroundColor(color),
  };
};

