/**
 * Re-export common DTOs from @repo/common.
 * These DTOs are shared across api-gateway and microservices.
 */
export {
  // Auth DTOs
  LoginDto,
  ForgotPasswordDto,
  VerifyCodeDto,
  ResetPasswordDto,
  ChangePasswordDto,
  
  // User DTOs
  CreateUserDto,
  UpdateUserDto,
  UpdateProfileDto,
  UserEmailsDto,
  UserIdsDto,
  
  // Role DTOs
  CreateRoleDto,
  RolePermissionDto,
  
  // Permission DTOs
  CreatePermissionDto,
  
  // Auth Response DTOs
  LoginResponseDto,
  ForgotPasswordResponseDto,
  VerifyCodeResponseDto,
  ResetPasswordResponseDto,
  ChangePasswordResponseDto,
  
  // User Response DTOs
  UserResponseDto,
  UserListResponseDto,
  CreateUserResponseDto,
  AdminActionResponseDto,
  UserListByEmailsOrIdsResponseDto,
  
  // Role Response DTOs
  RoleResponseDto,
  RoleWithPermissionsResponseDto,
  RolePermissionResponseDto,
  RoleListResponseDto,
  
  // Permission Response DTOs
  PermissionResponseDto,
  PermissionListResponseDto,
} from '@repo/common';

/**
 * User Info DTO - Simple user information for references
 */
export class UserInfoDto {
  user_id: number;
  email: string;
  fullName?: string;
  avatar?: string;
}
