import { 
  IsEmail, 
  IsString, 
  MinLength, 
  IsOptional, 
  IsEnum, 
  Length, 
  IsNotEmpty,
  IsPhoneNumber,
  IsIn 
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { USER_ROLES, UserRoles } from '../../constants';

/**
 * DTO for creating a new user.
 */
export class CreateUserDto {
  @ApiProperty({ 
    description: 'Full name of the user', 
    example: 'John Doe' 
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ 
    description: 'Email address', 
    example: 'john.doe@example.com' 
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    description: 'Password (minimum 6 characters)', 
    example: 'password123',
    minLength: 6
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ 
    description: 'User role', 
    example: 'student',
    enum: USER_ROLES
  })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiPropertyOptional({ 
    description: 'User status', 
    example: 'active'
  })
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ 
    description: 'OTP code',
    example: '123456',
    minLength: 6,
    maxLength: 6
  })
  @Length(6, 6)
  @IsOptional()
  otp?: string;

  @ApiPropertyOptional({ 
    description: 'Phone number (Vietnamese format)', 
    example: '0901234567' 
  })
  @IsString()
  @IsOptional()
  @IsPhoneNumber('VN', { message: 'Invalid Vietnamese phone number' })
  phone?: string;

  @ApiPropertyOptional({ 
    description: 'Date of birth', 
    example: '1990-01-01' 
  })
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ 
    description: 'Gender', 
    example: 'male' 
  })
  @IsString()
  @IsOptional()
  gender?: string;
}

/**
 * DTO for updating a user.
 */
export class UpdateUserDto {
  @ApiPropertyOptional({ 
    description: 'Full name', 
    example: 'John Doe' 
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ 
    description: 'Email address', 
    example: 'john.doe@example.com' 
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ 
    description: 'Password', 
    example: 'newpassword123',
    minLength: 6
  })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ 
    description: 'User role', 
    example: 'student',
    enum: USER_ROLES
  })
  @IsEnum(USER_ROLES)
  @IsOptional()
  role?: UserRoles;

  @ApiPropertyOptional({ 
    description: 'User status', 
    example: 'active'
  })
  @IsOptional()
  status?: string;
}

/**
 * DTO for updating user status (admin action)
 */
export class UpdateUserStatusDto {
  @ApiProperty({ 
    description: 'User ID', 
    example: 1 
  })
  @IsNotEmpty()
  user_id: number;
}

/**
 * DTO for updating user profile
 */
export class UpdateProfileDto {
  @ApiPropertyOptional({ 
    description: 'Phone number', 
    example: '0901234567' 
  })
  @IsString({ message: 'Phone must be a string' })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ 
    description: 'Address', 
    example: '123 Street, City' 
  })
  @IsString({ message: 'Address must be a string' })
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ 
    description: 'Date of birth', 
    example: '1990-01-01' 
  })
  @IsString({ message: 'Date of birth must be a string' })
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ 
    description: 'Gender', 
    example: 'male' 
  })
  @IsString({ message: 'Gender must be a string' })
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ 
    description: 'Full name', 
    example: 'John Doe' 
  })
  @IsString({ message: 'Full name must be a string' })
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ 
    description: 'Status', 
    example: 'active',
    enum: ['active', 'blocked']
  })
  @IsIn(['active', 'blocked'], { message: 'Status must be active or blocked' })
  @IsOptional()
  status?: string;
}

/**
 * DTO for user emails list
 */
export class UserEmailsDto {
  @ApiProperty({
    description: 'Array of user emails', 
    example: ['user1@example.com', 'user2@example.com'],
    type: [String]
  })
  @IsEmail({}, { each: true })
  @IsNotEmpty()
  userEmails: string[];
}

/**
 * DTO for user IDs list
 */
export class UserIdsDto {
  @ApiProperty({
    description: 'Array of user IDs', 
    example: [1, 2, 3],
    type: [Number]
  })
  @IsNotEmpty()
  userIds: number[];
}
