import { IsEmail, IsNotEmpty, IsString, Length, Min, MinLength } from 'class-validator';

// DTO for forgot password request (email submission)
export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

// DTO for verifying the code sent to email
export class VerifyCodeDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @Length(6, 6)
  @IsNotEmpty()
  code: string;
}

// DTO for resetting password with verification code
export class ResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @Length(6, 6)
  @IsNotEmpty()
  code: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  confirmPassword: string;
}
