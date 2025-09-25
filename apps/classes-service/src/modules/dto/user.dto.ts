import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength, IsOptional, IsBoolean, IsNumber, IsInt } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @MinLength(6)
  password: string;
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
  email: string;

  @IsString()
  password: string;
}

export class UserInfoDto {
  @IsInt()
  id: number;

  @IsEmail()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;
}