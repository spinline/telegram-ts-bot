import crypto from 'crypto';

// Interface for verification session
interface VerificationSession {
  userId: number;
  code: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
  verified: boolean;
}

// In-memory storage for verification sessions
const verificationSessions = new Map<number, VerificationSession>();

// In-memory storage for verified users
const verifiedUsers = new Set<number>();

// Configuration constants
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const MAX_VERIFICATION_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 15;

// Lockout tracking
const lockedOutUsers = new Map<number, Date>();

/**
 * Generate a cryptographically secure OTP code
 */
export function generateOTP(): string {
  const digits = '0123456789';
  let otp = '';
  const randomBytes = crypto.randomBytes(OTP_LENGTH);
  
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[randomBytes[i] % digits.length];
  }
  
  return otp;
}

/**
 * Create a new verification session for a user
 */
export function createVerificationSession(userId: number): string {
  // Check if user is locked out
  if (isUserLockedOut(userId)) {
    const lockoutEnd = lockedOutUsers.get(userId);
    const minutesRemaining = lockoutEnd 
      ? Math.ceil((lockoutEnd.getTime() - Date.now()) / (1000 * 60))
      : LOCKOUT_MINUTES;
    throw new Error(`Too many failed attempts. Please try again in ${minutesRemaining} minutes.`);
  }

  const code = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  
  const session: VerificationSession = {
    userId,
    code,
    expiresAt,
    attempts: 0,
    createdAt: new Date(),
    verified: false,
  };
  
  verificationSessions.set(userId, session);
  logVerificationEvent(userId, 'SESSION_CREATED', 'New verification session created');
  
  return code;
}

/**
 * Verify a user's OTP code
 */
export function verifyOTP(userId: number, inputCode: string): { success: boolean; message: string } {
  const session = verificationSessions.get(userId);
  
  if (!session) {
    logVerificationEvent(userId, 'VERIFY_FAILED', 'No active verification session');
    return { success: false, message: 'No active verification session. Please request a new code.' };
  }
  
  // Check if session has expired
  if (new Date() > session.expiresAt) {
    verificationSessions.delete(userId);
    logVerificationEvent(userId, 'VERIFY_FAILED', 'Verification code expired');
    return { success: false, message: 'Verification code has expired. Please request a new code.' };
  }
  
  // Increment attempt count
  session.attempts++;
  
  // Check if code matches
  if (session.code === inputCode) {
    session.verified = true;
    verifiedUsers.add(userId);
    verificationSessions.delete(userId);
    
    // Remove from lockout if present
    if (lockedOutUsers.has(userId)) {
      lockedOutUsers.delete(userId);
    }
    
    logVerificationEvent(userId, 'VERIFY_SUCCESS', 'User successfully verified');
    return { success: true, message: 'Verification successful! You can now use the bot.' };
  }
  
  // Check if max attempts reached
  if (session.attempts >= MAX_VERIFICATION_ATTEMPTS) {
    verificationSessions.delete(userId);
    const lockoutEnd = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
    lockedOutUsers.set(userId, lockoutEnd);
    
    logVerificationEvent(userId, 'VERIFY_FAILED', `Maximum attempts reached. User locked out until ${lockoutEnd.toISOString()}`);
    return { 
      success: false, 
      message: `Maximum verification attempts reached. You are locked out for ${LOCKOUT_MINUTES} minutes.` 
    };
  }
  
  const remainingAttempts = MAX_VERIFICATION_ATTEMPTS - session.attempts;
  logVerificationEvent(userId, 'VERIFY_FAILED', `Invalid code provided. Attempts: ${session.attempts}/${MAX_VERIFICATION_ATTEMPTS}`);
  
  return { 
    success: false, 
    message: `Invalid verification code. You have ${remainingAttempts} attempt(s) remaining.` 
  };
}

/**
 * Check if a user is verified
 */
export function isUserVerified(userId: number): boolean {
  return verifiedUsers.has(userId);
}

/**
 * Check if a user is locked out
 */
export function isUserLockedOut(userId: number): boolean {
  const lockoutEnd = lockedOutUsers.get(userId);
  
  if (!lockoutEnd) {
    return false;
  }
  
  // Check if lockout period has expired
  if (new Date() > lockoutEnd) {
    lockedOutUsers.delete(userId);
    return false;
  }
  
  return true;
}

/**
 * Get remaining lockout time in minutes
 */
export function getRemainingLockoutTime(userId: number): number {
  const lockoutEnd = lockedOutUsers.get(userId);
  
  if (!lockoutEnd) {
    return 0;
  }
  
  const remaining = lockoutEnd.getTime() - Date.now();
  return Math.ceil(remaining / (1000 * 60));
}

/**
 * Get active verification session for a user
 */
export function getVerificationSession(userId: number): VerificationSession | undefined {
  return verificationSessions.get(userId);
}

/**
 * Remove verification for a user (for testing/admin purposes)
 */
export function removeUserVerification(userId: number): void {
  verifiedUsers.delete(userId);
  verificationSessions.delete(userId);
  lockedOutUsers.delete(userId);
  logVerificationEvent(userId, 'VERIFICATION_REMOVED', 'User verification status removed');
}

/**
 * Log verification events for audit purposes
 */
function logVerificationEvent(userId: number, event: string, details: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[VERIFICATION] ${timestamp} | User: ${userId} | Event: ${event} | Details: ${details}`);
}

/**
 * Clean up expired sessions periodically
 */
export function cleanupExpiredSessions(): void {
  const now = new Date();
  let cleanedCount = 0;
  
  for (const [userId, session] of verificationSessions.entries()) {
    if (now > session.expiresAt) {
      verificationSessions.delete(userId);
      cleanedCount++;
    }
  }
  
  // Clean up expired lockouts
  for (const [userId, lockoutEnd] of lockedOutUsers.entries()) {
    if (now > lockoutEnd) {
      lockedOutUsers.delete(userId);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`[VERIFICATION] Cleaned up ${cleanedCount} expired sessions/lockouts`);
  }
}

// Start periodic cleanup every 5 minutes
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);
