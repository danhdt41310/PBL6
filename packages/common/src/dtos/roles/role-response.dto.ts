import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Role Response DTO
 * Standard role information response
 */
export class RoleResponseDto {
  @ApiProperty({ description: 'Role ID' })
  role_id: number;

  @ApiProperty({ description: 'Role name' })
  name: string;

  @ApiPropertyOptional({ description: 'Role description' })
  description?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at: Date;
}

/**
 * Role With Permissions Response DTO
 * Role information including associated permissions
 */
export class RoleWithPermissionsResponseDto extends RoleResponseDto {
  @ApiProperty({ 
    description: 'List of permissions associated with this role',
    type: 'array',
    items: { type: 'object' }
  })
  permissions: Array<{
    permission_id: number;
    key: string;
    name: string;
    description?: string;
    resource: string;
    action: string;
  }>;
}

/**
 * Role Permission Assignment Response DTO
 * Response after assigning permissions to a role
 */
export class RolePermissionResponseDto {
  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Name of the role' })
  roleName: string;

  @ApiProperty({ 
    description: 'List of permission keys assigned',
    type: [String]
  })
  permissionsAssigned: string[];
}

/**
 * Role List Response DTO
 * List of all roles with their permissions
 */
export class RoleListResponseDto {
  @ApiProperty({ 
    description: 'List of roles with permissions',
    type: [RoleWithPermissionsResponseDto]
  })
  roles: RoleWithPermissionsResponseDto[];

  @ApiProperty({ description: 'Total number of roles' })
  total: number;
}

/**
 * Create Role Response DTO
 * Response after creating a new role
 */
export class CreateRoleResponseDto {
  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Created role information', type: RoleResponseDto })
  role: RoleResponseDto;
}

/**
 * Update Role Response DTO
 * Response after updating a role
 */
export class UpdateRoleResponseDto {
  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Updated role information', type: RoleResponseDto })
  role: RoleResponseDto;
}

/**
 * Delete Role Response DTO
 * Response after deleting a role
 */
export class DeleteRoleResponseDto {
  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'ID of deleted role' })
  role_id: number;
}
