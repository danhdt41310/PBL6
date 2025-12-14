import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Login Response DTO
 * Response returned after successful login
 */
export class LoginResponseDto {
  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiPropertyOptional({ description: 'User information', type: 'object' })
  user?: any;

  @ApiPropertyOptional({ description: 'Access token for authentication' })
  accessToken?: string;

  @ApiPropertyOptional({ description: 'Refresh token for renewing access' })
  refreshToken?: string;
}

/**
 * Forgot Password Response DTO
 * Response after initiating password reset
 */
export class ForgotPasswordResponseDto {
  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiPropertyOptional({ description: 'Success status' })
  success?: boolean;
}

/**
 * Verify Code Response DTO
 * Response after verifying reset code
 */
export class VerifyCodeResponseDto {
  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiPropertyOptional({ description: 'Success status' })
  success?: boolean;

  @ApiPropertyOptional({ description: 'Verification validity status' })
  isValid?: boolean;

  @ApiPropertyOptional({ description: 'Verification validity status (alias)' })
  valid?: boolean;
}

/**
 * Reset Password Response DTO
 * Response after password reset
 */
export class ResetPasswordResponseDto {
  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiPropertyOptional({ description: 'Success status' })
  success?: boolean;
}

/**
 * Change Password Response DTO
 * Response after changing password
 */
export class ChangePasswordResponseDto {
  @ApiProperty({ description: 'Response message' })
  message: string;
}
