import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength, IsOptional, IsBoolean, IsNumber, IsInt, Length, IsNotEmpty } from 'class-validator';
import { IsMatchedPassword } from 'src/common/decorators/is-matched-password.decorator';

export class CreateUserDto {
  @IsString()
  full_name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  role: string;

  @IsOptional()
  status?: string;

  @IsOptional()
  otp?: string;
}

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UserInfoDto {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  id: number;

  @IsEmail()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;
}

// DTO for forgot password request (email submission)
export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string
}

export class VerifyCodeDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @Length(6, 6)
  @IsNotEmpty()
  code: string;
}

export class ResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsString()
  @Length(6, 6)
  @IsNotEmpty()
  code: string

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  @IsMatchedPassword('password')
  confirmPassword: string
}

export class UpdateProfileDto {
  @IsString({ message: 'Full name must be a string' })
  @IsNotEmpty({ message: 'Full name is required' })
  full_name: string;
}

