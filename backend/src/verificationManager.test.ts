import {
  generateOTP,
  createVerificationSession,
  verifyOTP,
  isUserVerified,
  isUserLockedOut,
  getRemainingLockoutTime,
  removeUserVerification,
} from './verificationManager';

// Simple test runner
function runTests() {
  console.log('Starting verification system tests...\n');
  
  let passedTests = 0;
  let failedTests = 0;
  
  // Test 1: Generate OTP
  console.log('Test 1: Generate OTP');
  try {
    const otp = generateOTP();
    if (otp.length === 6 && /^\d{6}$/.test(otp)) {
      console.log(`✅ PASS - Generated valid OTP: ${otp}`);
      passedTests++;
    } else {
      console.log(`❌ FAIL - Invalid OTP format: ${otp}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error}`);
    failedTests++;
  }
  console.log('');
  
  // Test 2: Create verification session
  console.log('Test 2: Create verification session');
  try {
    const testUserId = 12345;
    const code = createVerificationSession(testUserId);
    if (code.length === 6 && /^\d{6}$/.test(code)) {
      console.log(`✅ PASS - Created session with code: ${code}`);
      passedTests++;
    } else {
      console.log(`❌ FAIL - Invalid session code: ${code}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error}`);
    failedTests++;
  }
  console.log('');
  
  // Test 3: Verify correct OTP
  console.log('Test 3: Verify correct OTP');
  try {
    const testUserId = 23456;
    const code = createVerificationSession(testUserId);
    const result = verifyOTP(testUserId, code);
    if (result.success && isUserVerified(testUserId)) {
      console.log(`✅ PASS - Successfully verified user`);
      passedTests++;
    } else {
      console.log(`❌ FAIL - Verification failed: ${result.message}`);
      failedTests++;
    }
    removeUserVerification(testUserId);
  } catch (error) {
    console.log(`❌ FAIL - ${error}`);
    failedTests++;
  }
  console.log('');
  
  // Test 4: Verify incorrect OTP
  console.log('Test 4: Verify incorrect OTP');
  try {
    const testUserId = 34567;
    createVerificationSession(testUserId);
    const result = verifyOTP(testUserId, '000000');
    if (!result.success && !isUserVerified(testUserId)) {
      console.log(`✅ PASS - Correctly rejected invalid code`);
      passedTests++;
    } else {
      console.log(`❌ FAIL - Should have rejected invalid code`);
      failedTests++;
    }
    removeUserVerification(testUserId);
  } catch (error) {
    console.log(`❌ FAIL - ${error}`);
    failedTests++;
  }
  console.log('');
  
  // Test 5: Maximum attempts and lockout
  console.log('Test 5: Maximum attempts and lockout');
  try {
    const testUserId = 45678;
    createVerificationSession(testUserId);
    
    // Make 3 failed attempts
    verifyOTP(testUserId, '111111');
    verifyOTP(testUserId, '222222');
    const result = verifyOTP(testUserId, '333333');
    
    if (!result.success && isUserLockedOut(testUserId)) {
      const lockoutTime = getRemainingLockoutTime(testUserId);
      console.log(`✅ PASS - User locked out after 3 failed attempts (${lockoutTime} minutes remaining)`);
      passedTests++;
    } else {
      console.log(`❌ FAIL - Should have locked out user after 3 failed attempts`);
      failedTests++;
    }
    removeUserVerification(testUserId);
  } catch (error) {
    console.log(`❌ FAIL - ${error}`);
    failedTests++;
  }
  console.log('');
  
  // Test 6: Cannot create session when locked out
  console.log('Test 6: Cannot create session when locked out');
  try {
    const testUserId = 56789;
    createVerificationSession(testUserId);
    
    // Trigger lockout
    verifyOTP(testUserId, '111111');
    verifyOTP(testUserId, '222222');
    verifyOTP(testUserId, '333333');
    
    // Try to create new session while locked out
    try {
      createVerificationSession(testUserId);
      console.log(`❌ FAIL - Should not allow session creation while locked out`);
      failedTests++;
    } catch (error: any) {
      if (error.message.includes('locked') || error.message.includes('failed attempts') || error.message.includes('try again')) {
        console.log(`✅ PASS - Correctly prevented session creation during lockout`);
        passedTests++;
      } else {
        console.log(`❌ FAIL - Wrong error: ${error.message}`);
        failedTests++;
      }
    }
    removeUserVerification(testUserId);
  } catch (error) {
    console.log(`❌ FAIL - ${error}`);
    failedTests++;
  }
  console.log('');
  
  // Test 7: Verify no session exists
  console.log('Test 7: Verify no session exists');
  try {
    const testUserId = 67890;
    const result = verifyOTP(testUserId, '123456');
    if (!result.success && result.message.includes('No active verification session')) {
      console.log(`✅ PASS - Correctly handled missing session`);
      passedTests++;
    } else {
      console.log(`❌ FAIL - Should reject verification without session`);
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ FAIL - ${error}`);
    failedTests++;
  }
  console.log('');
  
  // Summary
  console.log('='.repeat(50));
  console.log(`Test Summary: ${passedTests} passed, ${failedTests} failed`);
  console.log('='.repeat(50));
  
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
runTests();
