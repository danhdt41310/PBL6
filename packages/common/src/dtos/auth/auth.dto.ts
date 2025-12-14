import { IsEmail, IsNotEmpty, IsString, Length, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Auth DTOs
 * Shared DTOs for authentication operations across api-gateway and users-service
 */

/**
 * DTO for user login
 */
export class LoginDto {
  @ApiProperty({ 
    description: 'Email address', 
    example: 'john.doe@example.com' 
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    description: 'Password', 
    example: 'password123' 
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

/**
 * DTO for forgot password request
 */
export class ForgotPasswordDto {
  @ApiProperty({ 
    description: 'Email address', 
    example: 'john.doe@example.com' 
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

/**
 * DTO for verifying the code sent to email
 */
export class VerifyCodeDto {
  @ApiProperty({ 
    description: 'Email address', 
    example: 'john.doe@example.com' 
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    description: 'Verification code (6 digits)', 
    example: '123456',
    minLength: 6,
    maxLength: 6
  })
  @IsString()
  @Length(6, 6)
  @IsNotEmpty()
  code: string;
}

/**
 * DTO for resetting password with verification code
 */
export class ResetPasswordDto {
  @ApiProperty({ 
    description: 'Email address', 
    example: 'john.doe@example.com' 
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    description: 'Verification code (6 digits)', 
    example: '123456',
    minLength: 6,
    maxLength: 6
  })
  @IsString()
  @Length(6, 6)
  @IsNotEmpty()
  code: string;

  @ApiProperty({ 
    description: 'New password (minimum 6 characters)', 
    example: 'newpassword123',
    minLength: 6
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ 
    description: 'Confirm password', 
    example: 'newpassword123',
    minLength: 6
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  confirmPassword: string;
}

/**
 * DTO for change password
 */
export class ChangePasswordDto {
  @ApiProperty({ 
    description: 'Current password', 
    example: 'oldpassword123' 
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ 
    description: 'New password (minimum 6 characters)', 
    example: 'newpassword123',
    minLength: 6
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  newPassword: string;
}
