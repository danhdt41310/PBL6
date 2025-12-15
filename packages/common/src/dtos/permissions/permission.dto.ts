import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new permission
 */
export class CreatePermissionDto {
  @ApiProperty({ 
    description: 'Permission key (unique identifier)', 
    example: 'user.create' 
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiPropertyOptional({ 
    description: 'Permission name (display name)', 
    example: 'Create User' 
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ 
    description: 'Permission description', 
    example: 'Allows creating new users' 
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Resource the permission applies to', 
    example: 'user' 
  })
  @IsString()
  @IsOptional()
  resource?: string;

  @ApiPropertyOptional({ 
    description: 'Action the permission allows', 
    example: 'create' 
  })
  @IsString()
  @IsOptional()
  action?: string;
}
