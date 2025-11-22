/**
 * useNavigation Hook
 * Handle screen navigation and history
 */

import { useState, useEffect, useCallback } from 'react';
import { telegramService } from '../services/telegram';
import type { Screen, ScreenHistory } from '../types/navigation';

export const useNavigation = (initialScreen: Screen = 'welcome') => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(initialScreen);
  const [screenHistory, setScreenHistory] = useState<ScreenHistory>([initialScreen]);

  // Update back button visibility
  useEffect(() => {
    const backButton = telegramService.getWebApp().BackButton;

    if (currentScreen === 'welcome') {
      backButton?.hide();
    } else {
      backButton?.show();
    }
  }, [currentScreen]);

  // Handle back button click
  useEffect(() => {
    const backButton = telegramService.getWebApp().BackButton;

    const handleBackClick = () => {
      telegramService.hapticFeedback('light');

      setScreenHistory(prev => {
        if (prev.length > 1) {
          const newHistory = [...prev];
          newHistory.pop();
          const previousScreen = newHistory[newHistory.length - 1];
          setCurrentScreen(previousScreen);
          return newHistory;
        }
        return prev;
      });
    };

    backButton?.onClick(handleBackClick);

    return () => {
      backButton?.offClick(handleBackClick);
    };
  }, []);

  const navigateTo = useCallback((screen: Screen) => {
    telegramService.hapticFeedback('light');
    setScreenHistory(prev => [...prev, screen]);
    setCurrentScreen(screen);
  }, []);

  const navigateBack = useCallback(() => {
    telegramService.hapticFeedback('light');
    setScreenHistory(prev => {
      if (prev.length > 1) {
        const newHistory = [...prev];
        newHistory.pop();
        const previousScreen = newHistory[newHistory.length - 1];
        setCurrentScreen(previousScreen);
        return newHistory;
      }
      return prev;
    });
  }, []);

  const resetNavigation = useCallback(() => {
    setScreenHistory(['welcome']);
    setCurrentScreen('welcome');
  }, []);

  return {
    currentScreen,
    screenHistory,
    navigateTo,
    navigateBack,
    resetNavigation,
  };
};

