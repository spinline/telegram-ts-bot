# User Verification Feature Documentation

## Overview

The Telegram bot now includes a mandatory user verification system to ensure that only authenticated users can access bot features. This document explains how the verification system works and how users interact with it.

## Features

### Security Features
- **One-Time Passcodes (OTP)**: 6-digit cryptographically secure codes
- **Time-Limited Sessions**: Verification codes expire after 5 minutes
- **Attempt Limiting**: Maximum 3 attempts per verification session
- **Lockout Protection**: 15-minute lockout after failed verification attempts
- **Audit Logging**: All verification events are logged for security auditing

### User Experience
- Clear welcome message explaining verification requirement
- Step-by-step guidance through the verification process
- Helpful error messages with remaining attempts
- Assistance options for users who need help
- Automatic retry options for expired codes

## User Flow

### 1. Initial Bot Interaction
When a user starts the bot with `/start`, they receive a welcome message explaining the verification requirement:

```
🔐 Welcome to VPN Bot - Verification Required

For your security and to ensure only authenticated users access our services, 
we require all users to complete a verification process.

Why Verification?
• Protect your account from unauthorized access
• Ensure secure VPN service delivery
• Maintain system integrity

How it works:
1. Click "Start Verification" below
2. You'll receive a 6-digit verification code
3. Enter the code when prompted
4. Access granted! ✅
```

### 2. Starting Verification
When the user clicks "🔐 Start Verification", they receive a 6-digit OTP code:

```
🔐 Verification Code

Your verification code is: 123456

⏱ This code will expire in 5 minutes.
📝 You have 3 attempts to enter the correct code.

Please use the /verify command followed by your code:
Example: /verify 123456
```

### 3. Submitting Verification Code
Users submit their code using the `/verify` command:

```
/verify 123456
```

#### Success Response
```
✅ Verification successful! You can now use the bot.

Welcome to the VPN Bot! You can now access all features.

Click below to get started or use /start anytime.
```

#### Failure Response (with remaining attempts)
```
❌ Invalid verification code. You have 2 attempt(s) remaining.

Please try again or request a new code if yours has expired.
```

#### Lockout Response (after 3 failed attempts)
```
🔒 Account Locked

Maximum verification attempts reached. You are locked out for 15 minutes.

You can try again in 15 minute(s).
```

### 4. Getting Help
Users can click "❓ Need Help?" at any time to see assistance information:

```
🆘 Verification Help

Common Issues:

Can't receive verification code?
• Make sure you clicked "Start Verification"
• Check that the bot can send you messages
• Try the /start command again

Code expired?
• Verification codes expire after 5 minutes
• Click "Start Verification" again to get a new code

Too many failed attempts?
• After 3 incorrect attempts, you'll be locked out for 15 minutes
• Wait for the lockout period to end
• Then start verification again

Still need help?
• Contact support: @support_username
• Email: support@example.com

Commands:
/start - Start over and begin verification
/verify <code> - Enter your verification code
/help - Show general help
```

## Technical Implementation

### Architecture

#### Components
1. **verificationManager.ts**: Core verification logic
   - Session management
   - OTP generation
   - Verification validation
   - Lockout enforcement
   - Audit logging

2. **index.ts**: Bot integration
   - Middleware for verification checks
   - Command handlers
   - Callback query handlers
   - User interface

#### Data Storage
- **In-Memory Storage**: Sessions and verification status stored in memory
- **Automatic Cleanup**: Expired sessions cleaned every 5 minutes
- **Note**: Verification state is lost on bot restart (acceptable for this use case)

### Security Features

#### OTP Generation
```typescript
// Uses rejection sampling to avoid modulo bias
export function generateOTP(): string {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < OTP_LENGTH; i++) {
    let randomValue;
    const maxAcceptableValue = 256 - (256 % digits.length);
    
    do {
      randomValue = crypto.randomBytes(1)[0];
    } while (randomValue >= maxAcceptableValue);
    
    otp += digits[randomValue % digits.length];
  }
  
  return otp;
}
```

#### Verification Checks
```typescript
// Middleware checks verification status before allowing access
bot.use(async (ctx, next) => {
  const userId = ctx.from?.id;
  
  // Skip for /start and /verify commands
  if (isVerificationCommand(ctx)) {
    return next();
  }
  
  // Require verification for all other interactions
  if (userId && !isUserVerified(userId)) {
    // Redirect to verification flow
    return;
  }
  
  return next();
});
```

### Logging

All verification events are logged with the following format:
```
[VERIFICATION] 2025-10-22T11:49:52.023Z | User: 12345 | Event: SESSION_CREATED | Details: New verification session created
[VERIFICATION] 2025-10-22T11:49:52.024Z | User: 23456 | Event: VERIFY_SUCCESS | Details: User successfully verified
[VERIFICATION] 2025-10-22T11:49:52.025Z | User: 34567 | Event: VERIFY_FAILED | Details: Invalid code provided. Attempts: 1/3
```

#### Event Types
- `SESSION_CREATED`: New verification session initiated
- `VERIFY_SUCCESS`: User successfully verified
- `VERIFY_FAILED`: Verification attempt failed
- `VERIFICATION_REMOVED`: User verification status cleared

## Configuration

### Constants (in verificationManager.ts)
```typescript
const OTP_LENGTH = 6;              // Length of OTP codes
const OTP_EXPIRY_MINUTES = 5;      // Code expiration time
const MAX_VERIFICATION_ATTEMPTS = 3; // Attempts before lockout
const LOCKOUT_MINUTES = 15;         // Lockout duration
```

These can be adjusted based on security requirements:
- Increase `OTP_EXPIRY_MINUTES` for slower users
- Adjust `MAX_VERIFICATION_ATTEMPTS` for stricter/looser security
- Modify `LOCKOUT_MINUTES` to change penalty duration

## Testing

### Running Tests
```bash
cd backend
npm run build
npx ts-node src/verificationManager.test.ts
```

### Test Coverage
- OTP generation and format validation
- Verification session creation
- Correct code verification
- Incorrect code handling
- Maximum attempt limiting and lockout
- Lockout enforcement
- Missing session handling

All 7 tests should pass:
```
==================================================
Test Summary: 7 passed, 0 failed
==================================================
```

## Deployment Considerations

### State Management
- Current implementation uses in-memory storage
- Verification state is lost on bot restart
- For production with multiple instances, consider:
  - Redis for shared session storage
  - Database for persistent verification records

### Monitoring
- Monitor verification logs for suspicious patterns
- Track lockout frequency
- Alert on high failure rates

### Scalability
- Automatic session cleanup runs every 5 minutes
- No database queries for verification checks
- Memory usage scales with concurrent verifications

## Future Enhancements

### Potential Improvements
1. **Persistent Storage**: Store verification status in database
2. **Alternative Methods**: SMS, email, or TOTP-based verification
3. **Rate Limiting**: Prevent automated abuse
4. **Admin Commands**: Manual verification management
5. **Whitelist**: Auto-verify trusted users
6. **Analytics**: Verification success/failure metrics

## Support

For issues or questions about the verification system:
- Check the logs for detailed error information
- Review the test suite for expected behavior
- Consult the code documentation in source files

## License

This verification system is part of the telegram-ts-bot project.
