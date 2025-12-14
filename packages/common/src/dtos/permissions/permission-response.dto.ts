import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Permission Response DTO
 * Standard permission information response
 */
export class PermissionResponseDto {
  @ApiProperty({ description: 'Permission ID' })
  permission_id: number;

  @ApiProperty({ description: 'Permission key (unique identifier)' })
  key: string;

  @ApiProperty({ description: 'Permission name (display name)' })
  name: string;

  @ApiPropertyOptional({ description: 'Permission description' })
  description?: string;

  @ApiProperty({ description: 'Resource this permission applies to' })
  resource: string;

  @ApiProperty({ description: 'Action allowed by this permission' })
  action: string;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at: Date;
}

/**
 * Permission List Response DTO
 * List of all permissions
 */
export class PermissionListResponseDto {
  @ApiProperty({ 
    description: 'List of permissions',
    type: [PermissionResponseDto]
  })
  permissions: PermissionResponseDto[];

  @ApiProperty({ description: 'Total number of permissions' })
  total: number;
}

/**
 * Create Permission Response DTO
 * Response after creating a new permission
 */
export class CreatePermissionResponseDto {
  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Created permission information', type: PermissionResponseDto })
  permission: PermissionResponseDto;
}

/**
 * Update Permission Response DTO
 * Response after updating a permission
 */
export class UpdatePermissionResponseDto {
  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Updated permission information', type: PermissionResponseDto })
  permission: PermissionResponseDto;
}

/**
 * Delete Permission Response DTO
 * Response after deleting a permission
 */
export class DeletePermissionResponseDto {
  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'ID of deleted permission' })
  permission_id: number;
}
