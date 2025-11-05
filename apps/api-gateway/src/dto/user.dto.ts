import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength, IsOptional, IsBoolean, IsNumber, IsInt, Length, IsNotEmpty, IsPhoneNumber } from 'class-validator';
import { IsMatchedPassword } from '../common/decorators/is-matched-password.decorator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'Full name of the user', example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiProperty({ description: 'Email address', example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password (minimum 6 characters)', example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'User role', example: 'student' })
  @IsString()
  role: string;

  @ApiPropertyOptional({ description: 'User status', example: 'active' })
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'OTP code' })
  @IsOptional()
  otp?: string;

  @ApiPropertyOptional({ description: 'Phone number (Vietnamese format)', example: '0901234567' })
  @IsString()
  @IsOptional()
  @IsPhoneNumber('VN', { message: 'Invalid Vietnamese phone number' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Date of birth', example: '1990-01-01' })
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Gender', example: 'male' })
  @IsString()
  @IsOptional()
  gender?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Email address', example: 'john.doe@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'First name', example: 'John' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Doe' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class LoginDto {
  @ApiProperty({ description: 'Email address', example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Password', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UserInfoDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  id: number;

  @ApiProperty({ description: 'Email address', example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'First name', example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  @IsString()
  lastName: string;
}

// DTO for forgot password request (email submission)
export class ForgotPasswordDto {
  @ApiProperty({ description: 'Email address for password reset', example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string
}

export class VerifyCodeDto {
  @ApiProperty({ description: 'Email address', example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Verification code (6 digits)', example: '123456', minLength: 6, maxLength: 6 })
  @IsString()
  @Length(6, 6)
  @IsNotEmpty()
  code: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Email address', example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string

  @ApiProperty({ description: 'Verification code (6 digits)', example: '123456', minLength: 6, maxLength: 6 })
  @IsString()
  @Length(6, 6)
  @IsNotEmpty()
  code: string

  @ApiProperty({ description: 'New password (minimum 6 characters)', example: 'newPassword123', minLength: 6 })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string

  @ApiProperty({ description: 'Confirm new password', example: 'newPassword123', minLength: 6 })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  @IsMatchedPassword('password')
  confirmPassword: string
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password', example: 'currentPassword123' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ description: 'New password (minimum 6 characters)', example: 'newPassword123', minLength: 6 })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  newPassword: string;

  @ApiProperty({ description: 'Confirm new password', example: 'newPassword123', minLength: 6 })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  @IsMatchedPassword('newPassword')
  confirmPassword: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'Phone number', example: '0901234567' })
  @IsString({ message: 'Phone must be a string' })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Address', example: '123 Main St, City' })
  @IsString({ message: 'Address must be a string' })
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Date of birth', example: '1990-01-01' })
  @IsString({ message: 'Date of birth must be a string' })
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Gender', example: 'male' })
  @IsString({ message: 'Gender must be a string' })
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ description: 'Full name', example: 'John Doe' })
  @IsString({ message: 'Full name must be a string' })
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ description: 'User status', example: 'active' })
  @IsString({ message: 'Status must be a string' })
  @IsOptional()
  status?: string;
  
}

export class UserEmailsDto{
  @ApiProperty({ description: 'Array of user email addresses', example: ['user1@example.com', 'user2@example.com'], type: [String] })
  @IsEmail({},{each:true})
  userEmails: string[];
}

export class UserIdsDto{
  @ApiProperty({ description: 'Array of user IDs', example: [1, 2, 3], type: [Number] })
  @Transform(({value})=>{
    value.map((id:string)=>parseInt(id))
  })
  @IsInt({each:true})
  userIds: number[];
}

export class RolePermissionDto {
  @ApiProperty({ description: 'Role name', example: 'admin' })
  @IsString()
  @IsNotEmpty()
  roleName: string;

  @ApiProperty({ description: 'Array of permission names', example: ['read:users', 'write:users'], type: [String] })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  permissionNames: string[];
}

export class CreateRoleDto {
  @ApiProperty({ description: 'Role name', example: 'teacher' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Role description', example: 'Teacher role with specific permissions' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreatePermissionDto {
  @ApiProperty({ description: 'Permission key', example: 'read:users' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiPropertyOptional({ description: 'Permission name', example: 'Read Users' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Permission description', example: 'Allow reading user data' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Resource', example: 'users' })
  @IsString()
  @IsOptional()
  resource?: string;

  @ApiPropertyOptional({ description: 'Action', example: 'read' })
  @IsString()
  @IsOptional()
  action?: string;
}