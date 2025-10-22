# Verification Flow Summary

## Quick Reference

### Commands
- `/start` - Start bot and begin verification (if not verified)
- `/verify <code>` - Submit verification code
- `/help` - Show help information

### Buttons
- 🔐 Start Verification - Generate and receive OTP code
- ❓ Need Help? - View assistance information
- 🚀 Get Started - Access bot features after verification

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER STARTS BOT                         │
│                          /start command                         │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Is User Verified?     │
                    └────────┬───────┬───────┘
                             │       │
                        NO   │       │  YES
                             │       │
                             ▼       ▼
            ┌─────────────────────┐  ┌─────────────────────┐
            │ Show Verification   │  │  Show Main Menu     │
            │  Welcome Message    │  │  (Bot Features)     │
            └──────────┬──────────┘  └─────────────────────┘
                       │
                       ▼
            ┌─────────────────────┐
            │ Click "Start        │
            │  Verification"      │
            └──────────┬──────────┘
                       │
                       ▼
            ┌─────────────────────┐
            │ Generate 6-digit    │
            │  OTP Code           │
            │ (Expires in 5 min)  │
            └──────────┬──────────┘
                       │
                       ▼
            ┌─────────────────────┐
            │ User Receives Code  │
            │ via Message         │
            └──────────┬──────────┘
                       │
                       ▼
            ┌─────────────────────┐
            │ User Submits Code   │
            │ /verify XXXXXX      │
            └──────────┬──────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
           ▼                       ▼
    ┌────────────┐         ┌────────────┐
    │  CORRECT   │         │ INCORRECT  │
    │   CODE     │         │   CODE     │
    └─────┬──────┘         └─────┬──────┘
          │                      │
          ▼                      ▼
    ┌────────────┐      ┌─────────────────┐
    │ Verify     │      │ Increment       │
    │ Success!   │      │ Attempts (1-3)  │
    │            │      └────────┬─────────┘
    │ Grant      │               │
    │ Access     │     ┌─────────┴─────────┐
    └────────────┘     │                   │
                       ▼                   ▼
              ┌───────────────┐    ┌──────────────┐
              │ Attempts < 3  │    │ Attempts = 3 │
              │               │    │              │
              │ Show Error    │    │ LOCKOUT USER │
              │ + Retry       │    │ (15 minutes) │
              └───────────────┘    └──────────────┘
                      │                    │
                      └────────────────────┘
                               │
                               ▼
                      ┌─────────────────┐
                      │ Allow Retry or  │
                      │ Request New Code│
                      └─────────────────┘
```

## Security Features at Each Step

### 1. OTP Generation
- **Method**: `crypto.randomBytes()` with rejection sampling
- **Security**: No modulo bias, cryptographically secure
- **Format**: 6 digits (0-9)

### 2. Session Storage
- **Storage**: In-memory Map
- **Tracking**: User ID → Session data
- **Contents**: Code, expiry time, attempt count, timestamps

### 3. Verification Check
- **Validation**: Exact string match
- **Time Check**: Compare current time vs expiry
- **Attempt Tracking**: Increment and validate count

### 4. Lockout Enforcement
- **Trigger**: 3 failed attempts
- **Duration**: 15 minutes
- **Storage**: User ID → Lockout end time

### 5. Middleware Protection
- **Scope**: All bot interactions
- **Exceptions**: /start, /verify commands
- **Action**: Block and redirect unverified users

## State Transitions

```
UNVERIFIED ──┬──> [Start Verification] ──> SESSION_ACTIVE
             │
             └──> [Try to Use Bot] ──> BLOCKED (Redirect to Verification)

SESSION_ACTIVE ──┬──> [Correct Code] ──> VERIFIED ──> ACCESS_GRANTED
                 │
                 └──> [Wrong Code] ──┬──> [Attempts < 3] ──> RETRY
                                     │
                                     └──> [Attempts = 3] ──> LOCKED_OUT
                                                                  │
                                                                  └──> [Wait 15 min] ──> UNVERIFIED

LOCKED_OUT ──> [Try Verification] ──> BLOCKED (Show remaining time)

VERIFIED ──> [Any Bot Action] ──> ALLOWED
```

## Logging Events

Every action is logged with this format:
```
[VERIFICATION] <timestamp> | User: <user_id> | Event: <event_type> | Details: <description>
```

### Event Types:
1. **SESSION_CREATED** - New verification session started
2. **VERIFY_SUCCESS** - User successfully verified
3. **VERIFY_FAILED** - Verification attempt failed
4. **VERIFICATION_REMOVED** - Admin/test removal of verification

## Error Messages

### User-Facing Messages:
1. "No active verification session. Please request a new code."
2. "Verification code has expired. Please request a new code."
3. "Invalid verification code. You have X attempt(s) remaining."
4. "Maximum verification attempts reached. You are locked out for 15 minutes."
5. "You need to complete verification before using the bot."

### Each message provides:
- Clear problem description
- Next steps to resolve
- Actionable buttons/commands

## Configuration Constants

Located in `verificationManager.ts`:
```typescript
const OTP_LENGTH = 6;                    // 6-digit codes
const OTP_EXPIRY_MINUTES = 5;            // 5 minutes to use code
const MAX_VERIFICATION_ATTEMPTS = 3;     // 3 tries per session
const LOCKOUT_MINUTES = 15;              // 15 minute penalty
```

## Memory Management

### Automatic Cleanup (Every 5 minutes):
1. Scan all verification sessions
2. Delete expired sessions
3. Remove expired lockouts
4. Log cleanup count

### Manual Cleanup:
```typescript
removeUserVerification(userId);  // Clears all user verification data
```

## Testing Coverage

✅ All 7 tests pass:
1. OTP generation format validation
2. Session creation with valid code
3. Successful verification flow
4. Incorrect code rejection
5. Maximum attempts and lockout trigger
6. Lockout enforcement on new sessions
7. No session error handling

## Integration Points

### Bot Middleware
- Runs before every message/callback
- Checks user verification status
- Blocks unverified users (except /start, /verify)

### Command Handlers
- `/start` - Shows verification or main menu
- `/verify <code>` - Processes verification
- `/help` - Shows general help

### Callback Handlers
- `start_verification` - Creates OTP session
- `request_assistance` - Shows help
- `verified_start` - Shows main menu post-verification

## Future Considerations

### For Production at Scale:
1. **Persistent Storage**: Use Redis/database for sessions
2. **Rate Limiting**: Prevent verification spam
3. **Multiple Channels**: SMS, email, TOTP options
4. **Analytics**: Track verification metrics
5. **Admin Tools**: Manual verification management
6. **Whitelist**: Auto-verify trusted users
