import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * User Response DTO
 * Standard user information response
 */
export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  user_id: number;

  @ApiProperty({ description: 'Full name of the user' })
  full_name: string;

  @ApiProperty({ description: 'Email address' })
  email: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Address' })
  address?: string;

  @ApiPropertyOptional({ description: 'Date of birth' })
  dateOfBirth?: Date;

  @ApiPropertyOptional({ description: 'Gender' })
  gender?: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  avatar?: string;

  @ApiProperty({ description: 'User role' })
  role: string;

  @ApiProperty({ description: 'User status' })
  status: string;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at: Date;

  @ApiPropertyOptional({ description: 'Last update timestamp' })
  updated_at?: Date | null;
}

/**
 * User List Response DTO
 * Paginated list of users
 */
export class UserListResponseDto {
  @ApiProperty({ description: 'List of users', type: [UserResponseDto] })
  users: UserResponseDto[];

  @ApiProperty({ description: 'Total number of users' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}

/**
 * Create User Response DTO
 * Response after creating a new user
 */
export class CreateUserResponseDto {
  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Created user information', type: UserResponseDto })
  user: UserResponseDto;
}

/**
 * Update User Response DTO
 * Response after updating a user
 */
export class UpdateUserResponseDto {
  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Updated user information', type: UserResponseDto })
  user: UserResponseDto;
}

/**
 * Delete User Response DTO
 * Response after deleting a user
 */
export class DeleteUserResponseDto {
  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'ID of deleted user' })
  user_id: number;
}

/**
 * Admin Action Response DTO
 * Response for admin operations on users
 */
export class AdminActionResponseDto {
  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'User ID affected by the action' })
  user_id: number;
}

/**
 * User List By Emails Or IDs Response DTO
 * Response for bulk user queries
 */
export class UserListByEmailsOrIdsResponseDto {
  @ApiProperty({ description: 'List of users', type: [UserResponseDto] })
  users: UserResponseDto[];
}

/**
 * Role DTO for user permissions response
 */
export class RoleDto {
  @ApiProperty({ description: 'Role ID' })
  role_id: number;

  @ApiProperty({ description: 'Role name' })
  name: string;

  @ApiPropertyOptional({ description: 'Role description' })
  description?: string;
}

/**
 * Permission DTO for user permissions response
 */
export class PermissionDto {
  @ApiProperty({ description: 'Permission ID' })
  permission_id: number;

  @ApiProperty({ description: 'Permission key' })
  key: string;

  @ApiProperty({ description: 'Permission name' })
  name: string;

  @ApiPropertyOptional({ description: 'Permission description' })
  description?: string;

  @ApiProperty({ description: 'Resource type' })
  resource: string;

  @ApiProperty({ description: 'Action type' })
  action: string;
}

/**
 * User With Permissions Data DTO
 */
export class UserWithPermissionsDataDto extends UserResponseDto {
  @ApiProperty({ description: 'User roles', type: [RoleDto] })
  roles: RoleDto[];

  @ApiProperty({ description: 'User permissions', type: [PermissionDto] })
  permissions: PermissionDto[];
}

/**
 * User With Permissions Response DTO
 * Response for finding user with their permissions
 */
export class UserWithPermissionsResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'User data with permissions', type: UserWithPermissionsDataDto })
  data: UserWithPermissionsDataDto;
}
