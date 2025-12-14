/**
 * Shared user DTOs are now in @repo/common
 * Re-export from common package for backward compatibility
 */
export {
  // User DTOs
  CreateUserDto,
  UpdateUserDto,
  UpdateUserStatusDto,
  UpdateProfileDto,
  UserEmailsDto,
  UserIdsDto,
  
  // Auth DTOs (moved from users to auth module, but kept for backwards compat)
  ChangePasswordDto,
  LoginDto,
  
  // Role & Permission DTOs (moved to separate modules, but kept for backwards compat)
  RolePermissionDto,
  CreateRoleDto,
  CreatePermissionDto,
  
  // Response DTOs
  UserResponseDto,
  UserListResponseDto,
  CreateUserResponseDto,
  UpdateUserResponseDto,
  DeleteUserResponseDto,
  AdminActionResponseDto,
  UserListByEmailsOrIdsResponseDto,
} from '@repo/common';
