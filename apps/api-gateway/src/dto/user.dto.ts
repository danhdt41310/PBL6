import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength, IsOptional, IsBoolean, IsNumber, IsInt, Length, IsNotEmpty } from 'class-validator';
import { IsMatchedPassword } from '../common/decorators/is-matched-password.decorator';

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

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  newPassword: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  @IsMatchedPassword('newPassword')
  confirmPassword: string;
}

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

export class UserEmailsDto{
  @IsEmail({},{each:true})
  userEmails: string[];
}

export class UserIdsDto{
  @Transform(({value})=>{
    value.map((id:string)=>parseInt(id))
  })
  @IsInt({each:true})
  userIds: number[];
}

export class RolePermissionDto {
  @IsString()
  @IsNotEmpty()
  roleName: string;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  permissionNames: string[];
}

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  resource?: string;

  @IsString()
  @IsOptional()
  action?: string;
}