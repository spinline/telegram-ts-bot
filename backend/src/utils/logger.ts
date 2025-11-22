/**
 * Logger utility
 * Centralized logging with different levels
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private enabled = true;

  private formatMessage(level: LogLevel, message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      debug: '🔍'
    }[level];

    return `[${timestamp}] ${prefix} ${message}`;
  }

  info(message: string, ...args: any[]) {
    if (this.enabled) {
      console.log(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.enabled) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, ...args: any[]) {
    if (this.enabled) {
      console.error(this.formatMessage('error', message), ...args);
    }
  }

  debug(message: string, ...args: any[]) {
    if (this.enabled && process.env.NODE_ENV === 'development') {
      console.log(this.formatMessage('debug', message), ...args);
    }
  }

  disable() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }
}

export const logger = new Logger();

