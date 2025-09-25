import { IsEmail, IsString, MinLength, IsOptional, IsEnum, Length } from 'class-validator';

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
