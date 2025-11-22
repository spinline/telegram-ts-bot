/**
 * App Constants
 */

export const COLORS = {
  primary: '#14b8a6', // Teal
  headerBg: '#004f39',
  background: '#00150f',
} as const;

export const ONLINE_STALE_MS = 2 * 60 * 1000; // 2 minutes

export const PLATFORM = {
  IOS: 'iOS',
  ANDROID: 'Android',
} as const;

/**
 * Detect user platform
 */
export const detectPlatform = (): string => {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) {
    return PLATFORM.IOS;
  } else if (/Android/.test(ua)) {
    return PLATFORM.ANDROID;
  }
  return PLATFORM.IOS; // Default
};

