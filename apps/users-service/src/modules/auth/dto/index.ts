// Re-exports all DTOs for auth module
export * from './auth.dto';

// Re-exports all response DTOs from @repo/common
export {
  LoginResponseDto,
  ForgotPasswordResponseDto,
  VerifyCodeResponseDto,
  ResetPasswordResponseDto,
  ChangePasswordResponseDto,
} from '@repo/common';
