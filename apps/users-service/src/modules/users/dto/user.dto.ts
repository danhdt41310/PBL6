import { IsEmail, IsString, MinLength, IsOptional, IsEnum, Length, IsNotEmpty } from 'class-validator';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  TEACHER = 'teacher'
}

export enum UserStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked'
}

export class CreateUserDto {
  @IsString()
  full_name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @Length(6)
  @IsOptional()
  otp?: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  full_name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}


// DTO for admin to block/unblock a user
export class UpdateUserStatusDto {
  @IsNotEmpty()
  user_id: number;
}

// DTO for updating user profile
export class UpdateProfileDto {
  @IsString({ message: 'Phone must be a string' })
  @IsOptional()
  phone?: string;

  @IsString({ message: 'Address must be a string' })
  @IsOptional()
  address?: string;

  @IsString({ message: 'Date of birth must be a string' })
  @IsOptional()
  dateOfBirth?: string;

  @IsString({ message: 'Gender must be a string' })
  @IsOptional()
  gender?: string;

  @IsString({ message: 'Full name must be a string' })
  @IsOptional()
  fullName: string;
}

// DTO for change password
export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  current_password: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()  
  new_password: string;
}

// DTO for login uset
export class LoginDto{
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UserEmailsDto{
  @IsEmail({},{each:true})
  userEmails: string[];
}