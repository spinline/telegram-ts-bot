import { sessionManager } from '../../src/middlewares/session.middleware';

describe('SessionManager', () => {
  beforeEach(() => {
    // Clear all sessions before each test
    sessionManager.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve session', () => {
      const userId = 123;
      const session = { action: 'search' as const };

      sessionManager.set(userId, session);
      const retrieved = sessionManager.get(userId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.action).toBe('search');
    });

    it('should add timestamp automatically', () => {
      const userId = 123;
      const session = { action: 'broadcast' as const };

      sessionManager.set(userId, session);
      const retrieved = sessionManager.get(userId);

      expect(retrieved?.timestamp).toBeDefined();
      expect(typeof retrieved?.timestamp).toBe('number');
    });
  });

  describe('delete', () => {
    it('should remove session', () => {
      const userId = 123;
      sessionManager.set(userId, { action: 'search' });

      const deleted = sessionManager.delete(userId);
      const retrieved = sessionManager.get(userId);

      expect(deleted).toBe(true);
      expect(retrieved).toBeUndefined();
    });

    it('should return false for non-existent session', () => {
      const deleted = sessionManager.delete(999);
      expect(deleted).toBe(false);
    });
  });

  describe('has', () => {
    it('should return true for existing session', () => {
      const userId = 123;
      sessionManager.set(userId, { action: 'search' });

      expect(sessionManager.has(userId)).toBe(true);
    });

    it('should return false for non-existent session', () => {
      expect(sessionManager.has(999)).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all sessions', () => {
      sessionManager.set(1, { action: 'search' });
      sessionManager.set(2, { action: 'broadcast' });

      sessionManager.clear();

      expect(sessionManager.has(1)).toBe(false);
      expect(sessionManager.has(2)).toBe(false);
    });
  });
});

