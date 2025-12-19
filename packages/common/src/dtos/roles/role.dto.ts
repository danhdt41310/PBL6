import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new role.
 */
export class CreateRoleDto {
  @ApiProperty({
    description: 'Role system name (immutable identifier)',
    example: 'admin'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Display name for UI (user-facing)',
    example: 'Administrator'
  })
  @IsString()
  @IsNotEmpty()
  displayText: string;

  @ApiPropertyOptional({
    description: 'Role description',
    example: 'Administrator role with full access'
  })
  @IsString()
  @IsOptional()
  description?: string;
}

/**
 * DTO for updating a role
 * Note: 'name' field is immutable and cannot be updated
 */
export class UpdateRoleDto {
  @ApiPropertyOptional({
    description: 'Display name for UI (user-facing)',
    example: 'Administrator'
  })
  @IsString()
  @IsOptional()
  displayText?: string;

  @ApiPropertyOptional({
    description: 'Role description',
    example: 'Administrator role with full access'
  })
  @IsString()
  @IsOptional()
  description?: string;
}

/**
 * DTO for assigning permissions to a role
 */
export class RolePermissionDto {
  @ApiProperty({ 
    description: 'Role name', 
    example: 'admin' 
  })
  @IsString()
  @IsNotEmpty()
  roleName: string;

  @ApiProperty({ 
    description: 'Array of permission names', 
    example: ['user.create', 'user.read', 'user.update'],
    type: [String]
  })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  permissionNames: string[];
}
