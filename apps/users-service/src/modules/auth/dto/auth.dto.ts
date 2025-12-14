/**
 * Auth DTOs are now shared in @repo/common
 * Re-export from common package for backward compatibility
 */
export {
  LoginDto,
  ForgotPasswordDto,
  VerifyCodeDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from '@repo/common';
