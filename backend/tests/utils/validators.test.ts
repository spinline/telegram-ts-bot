import { logger } from '../../src/utils/logger';
import {
  validateTelegramId,
  validateUsername,
  validateMessage,
  formatBytes,
  getDaysLeft
} from '../../src/utils/validators';

describe('Validators', () => {
  describe('validateTelegramId', () => {
    it('should accept valid telegram ID', () => {
      expect(validateTelegramId(123456789)).toBe(123456789);
      expect(validateTelegramId('123456789')).toBe(123456789);
    });

    it('should reject invalid telegram ID', () => {
      expect(() => validateTelegramId(0)).toThrow('Invalid Telegram ID');
      expect(() => validateTelegramId(-1)).toThrow('Invalid Telegram ID');
      expect(() => validateTelegramId('abc')).toThrow('Invalid Telegram ID');
    });
  });

  describe('validateUsername', () => {
    it('should accept valid username', () => {
      expect(validateUsername('john_doe')).toBe('john_doe');
      expect(validateUsername('  user123  ')).toBe('user123');
    });

    it('should reject too short username', () => {
      expect(() => validateUsername('ab')).toThrow('Username too short');
    });

    it('should reject too long username', () => {
      const longName = 'a'.repeat(33);
      expect(() => validateUsername(longName)).toThrow('Username too long');
    });

    it('should reject invalid username', () => {
      expect(() => validateUsername('')).toThrow('Invalid username');
    });
  });

  describe('validateMessage', () => {
    it('should accept valid message', () => {
      expect(validateMessage('Hello world')).toBe('Hello world');
      expect(validateMessage('  test  ')).toBe('test');
    });

    it('should reject empty message', () => {
      expect(() => validateMessage('')).toThrow('Invalid message');
      expect(() => validateMessage('   ')).toThrow('Message is empty');
    });

    it('should reject too long message', () => {
      const longMessage = 'a'.repeat(4097);
      expect(() => validateMessage(longMessage)).toThrow('Message too long');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
      expect(formatBytes(1099511627776)).toBe('1 TB');
    });

    it('should handle decimal values', () => {
      expect(formatBytes(1536)).toBe('1.5 KB'); // 1.5 KB
      expect(formatBytes(2621440)).toBe('2.5 MB'); // 2.5 MB
    });
  });

  describe('getDaysLeft', () => {
    it('should calculate days left correctly', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(getDaysLeft(tomorrow)).toBe(1);
    });

    it('should handle past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      expect(getDaysLeft(yesterday)).toBeLessThanOrEqual(0);
    });

    it('should accept string dates', () => {
      const future = new Date();
      future.setDate(future.getDate() + 5);

      expect(getDaysLeft(future.toISOString())).toBe(5);
    });
  });
});

describe('Logger', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should log info messages', () => {
    logger.info('Test message');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should disable and enable logging', () => {
    logger.disable();
    logger.info('Should not log');
    expect(consoleSpy).not.toHaveBeenCalled();

    logger.enable();
    logger.info('Should log');
    expect(consoleSpy).toHaveBeenCalled();
  });
});

