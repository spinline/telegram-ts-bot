/**
 * Formatters
 * Utility functions for formatting data
 */

/**
 * Format bytes to human readable
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format date to Turkish locale
 */
export const formatDate = (isoDate: string | undefined): string | null => {
  if (!isoDate) return null;

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Calculate days left until expiration
 */
export const getDaysLeft = (expireDate: string | undefined): number | null => {
  if (!expireDate) return null;

  const expire = new Date(expireDate);
  const now = new Date();

  if (Number.isNaN(expire.getTime())) {
    return null;
  }

  const diff = expire.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * Check if subscription is expired
 */
export const isExpired = (expireDate: string | undefined): boolean => {
  if (!expireDate) return false;

  const expire = new Date(expireDate);
  const now = new Date();

  return expire < now;
};

/**
 * Format traffic percentage
 */
export const formatTrafficPercentage = (used: number, limit: number): string => {
  if (limit === 0) return '0';
  return ((used / limit) * 100).toFixed(0);
};

