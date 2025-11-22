/**
 * Validator utilities
 * Input validation helpers
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate Telegram ID
 */
export function validateTelegramId(id: any): number {
  const numId = typeof id === 'string' ? parseInt(id) : id;

  if (!Number.isInteger(numId) || numId <= 0) {
    throw new ValidationError('Invalid Telegram ID');
  }

  return numId;
}

/**
 * Validate username
 */
export function validateUsername(username: string): string {
  if (!username || typeof username !== 'string') {
    throw new ValidationError('Invalid username');
  }

  const trimmed = username.trim();

  if (trimmed.length < 3) {
    throw new ValidationError('Username too short');
  }

  if (trimmed.length > 32) {
    throw new ValidationError('Username too long');
  }

  return trimmed;
}

/**
 * Validate message text
 */
export function validateMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    throw new ValidationError('Invalid message');
  }

  const trimmed = message.trim();

  if (trimmed.length === 0) {
    throw new ValidationError('Message is empty');
  }

  if (trimmed.length > 4096) {
    throw new ValidationError('Message too long (max 4096 characters)');
  }

  return trimmed;
}

/**
 * Escape HTML special characters
 */
export function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Calculate days left
 */
export function getDaysLeft(expireDate: Date | string): number {
  const expire = new Date(expireDate);
  const now = new Date();
  const diff = expire.getTime() - now.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

