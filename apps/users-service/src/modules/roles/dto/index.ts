export * from './role.dto';

// Re-export response DTOs from @repo/common
export {
  RoleResponseDto,
  RoleWithPermissionsResponseDto,
  RolePermissionResponseDto,
  RoleListResponseDto,
  CreateRoleResponseDto,
  UpdateRoleResponseDto,
  DeleteRoleResponseDto,
} from '@repo/common';
