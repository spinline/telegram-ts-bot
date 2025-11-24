/**
 * Telegram WebApp Service
 * Wrapper for Telegram WebApp API
 */

import type { TelegramWebApp } from '../types/telegram';

class TelegramService {
  private webApp: TelegramWebApp;

  constructor() {
    this.webApp = (window as any).Telegram?.WebApp;

    if (!this.webApp) {
      console.warn('Telegram WebApp not available');
    }
  }

  /**
   * Initialize WebApp
   */
  ready(): void {
    this.webApp?.ready();
  }

  /**
   * Close WebApp
   */
  close(): void {
    this.webApp?.close();
  }

  /**
   * Expand WebApp to full screen
   */
  expand(): void {
    this.webApp?.expand();
  }

  /**
   * Set header color
   */
  setHeaderColor(color: string): void {
    this.webApp?.setHeaderColor(color);
  }

  /**
   * Set background color
   */
  setBackgroundColor(color: string): void {
    this.webApp?.setBackgroundColor(color);
  }

  /**
   * Get init data
   */
  getInitData(): string {
    return this.webApp?.initData ?? '';
  }

  /**
   * Get user data
   */
  getUser() {
    return this.webApp?.initDataUnsafe?.user;
  }

  /**
   * Show back button
   */
  showBackButton(): void {
    this.webApp?.BackButton?.show();
  }

  /**
   * Hide back button
   */
  hideBackButton(): void {
    this.webApp?.BackButton?.hide();
  }

  /**
   * Set back button click handler
   */
  onBackButton(callback: () => void): void {
    this.webApp?.BackButton?.onClick(callback);
  }

  /**
   * Remove back button click handler
   */
  offBackButton(callback: () => void): void {
    this.webApp?.BackButton?.offClick(callback);
  }

  /**
   * Trigger haptic feedback
   */
  hapticFeedback(style: 'light' | 'medium' | 'heavy' = 'light'): void {
    try {
      this.webApp?.HapticFeedback?.impactOccurred?.(style);
    } catch {
      console.log('Haptic feedback not supported');
    }
  }

  /**
   * Get WebApp instance
   */
  getWebApp(): TelegramWebApp {
    return this.webApp;
  }
}

// Singleton instance
export const telegramService = new TelegramService();

