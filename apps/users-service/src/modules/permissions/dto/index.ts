export * from './permission.dto';

// Re-export response DTOs from @repo/common
export {
  PermissionResponseDto,
  PermissionListResponseDto,
  CreatePermissionResponseDto,
  GetAllPermissionsResponseDto,
} from '@repo/common';
