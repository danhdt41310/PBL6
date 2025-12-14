/**
 * User Module Error Messages
 * Error messages specific to users module
 */
export const USER_ERRORS = {
  NOT_FOUND: 'User not found',
  ACCOUNT_BLOCKED: 'User account is blocked',
  INVALID_CREDENTIALS: 'Invalid email or password',
  CREATE_FAILED: 'Failed to create user',
  UPDATE_FAILED: 'Failed to update user',
  DELETE_FAILED: 'Failed to delete user',
  FIND_FAILED: 'Failed to find user',
  INVALID_EMAIL_FORMAT: 'Invalid email format',
  PASSWORD_MIN_LENGTH: 'Password must be at least 6 characters',
  PASSWORD_INCORRECT: 'Current password is incorrect',
  EMAIL_NOT_FOUND: 'Email is not registered in the system',
  ALREADY_EXISTS: 'User with this email already exists',
} as const;

/**
 * User Module Success Messages
 * Success messages specific to users module
 */
export const USER_SUCCESS = {
  CREATED: 'User created successfully',
  UPDATED: 'User updated successfully',
  DELETED: 'User deleted successfully',
  FOUND: 'User found successfully',
  LIST: 'Users retrieved successfully',
  BLOCKED: 'User blocked successfully',
  UNBLOCKED: 'User unblocked successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  USER_ACTIVATED: 'User activated successfully',
  USER_BLOCKED: 'User blocked successfully',
  FETCHED: 'User data fetched successfully',
  
  // Auth-related (used by auth module)
  LOGIN: 'Login successful',
  PASSWORD_CHANGED: 'Password changed successfully',
  PASSWORD_RESET: 'Password reset successfully',
  VERIFICATION_CODE_SENT: 'Verification code sent to your email',
  VERIFICATION_CODE_VALID: 'Verification code is valid',
} as const;
