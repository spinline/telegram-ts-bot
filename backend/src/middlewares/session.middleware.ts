/**
 * Session management for admin operations
 * Tracks user actions like search, broadcast, etc.
 */

export type AdminAction = 'search' | 'broadcast' | 'extend_days' | 'add_traffic';

export interface AdminSession {
  action: AdminAction | null;
  targetUser?: string;
  timestamp?: number;
}

class SessionManager {
  private sessions: Map<number, AdminSession> = new Map();

  /**
   * Set user session
   */
  set(userId: number, session: AdminSession) {
    this.sessions.set(userId, {
      ...session,
      timestamp: Date.now()
    });
  }

  /**
   * Get user session
   */
  get(userId: number): AdminSession | undefined {
    return this.sessions.get(userId);
  }

  /**
   * Delete user session
   */
  delete(userId: number): boolean {
    return this.sessions.delete(userId);
  }

  /**
   * Check if user has active session
   */
  has(userId: number): boolean {
    return this.sessions.has(userId);
  }

  /**
   * Clear all sessions
   */
  clear() {
    this.sessions.clear();
  }

  /**
   * Clean expired sessions (older than 1 hour)
   */
  cleanExpired() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    for (const [userId, session] of this.sessions.entries()) {
      if (session.timestamp && (now - session.timestamp > oneHour)) {
        this.sessions.delete(userId);
      }
    }
  }
}

export const sessionManager = new SessionManager();

// Clean expired sessions every 10 minutes
setInterval(() => {
  sessionManager.cleanExpired();
}, 10 * 60 * 1000);

