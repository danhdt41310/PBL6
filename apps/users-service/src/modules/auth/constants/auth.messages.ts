/**
 * Auth Module Error Messages.
 * Error messages specific to auth module.
 */
export const AUTH_ERRORS = {
  INVALID_EMAIL_FORMAT: 'Invalid email format',
  PASSWORD_MIN_LENGTH: 'Password must be at least 6 characters',
  PASSWORD_INCORRECT: 'Current password is incorrect',
  EMAIL_NOT_REGISTERED: 'Email is not registered in the system',
  VERIFICATION_CODE_INVALID: 'Verification code is invalid or expired',
  VERIFICATION_CODE_FORMAT: 'Verification code must be 6 digits',
  TOKEN_EXPIRED: 'Token has expired',
  TOKEN_INVALID: 'Invalid token',
  UNAUTHORIZED: 'Unauthorized access',
  LOGIN_FAILED: 'Login failed',
} as const;

/**
 * Verification Code Error Messages.
 * Error messages specific to verification codes.
 */
export const VERIFICATION_CODE_ERRORS = {
  NOT_FOUND: 'Verification code not found',
  EXPIRED: 'Verification code has expired',
  ALREADY_USED: 'Verification code has already been used',
  INVALID: 'Verification code is invalid or expired',
  INVALID_FORMAT: 'Verification code must be 6 digits',
  CREATE_FAILED: 'Failed to create verification code',
  SEND_FAILED: 'Failed to send verification code',
} as const;

/**
 * Auth Module Success Messages.
 * Success messages specific to auth module.
 */
export const AUTH_SUCCESS = {
  LOGIN: 'Login successful',
  LOGOUT: 'Logout successful',
  PASSWORD_CHANGED: 'Password changed successfully',
  PASSWORD_RESET: 'Password reset successfully',
  CODE_SENT: 'Verification code sent successfully',
  CODE_VERIFIED: 'Verification code verified successfully',
  TOKEN_REFRESHED: 'Token refreshed successfully',
  VERIFICATION_CODE_SENT: 'Verification code sent to your email',
  VERIFICATION_CODE_VALID: 'Verification code is valid',
} as const;

/**
 * Verification Code Success Messages.
 * Success messages specific to verification codes.
 */
export const VERIFICATION_CODE_SUCCESS = {
  SENT: 'Verification code sent successfully',
  VERIFIED: 'Verification code verified successfully',
} as const;
