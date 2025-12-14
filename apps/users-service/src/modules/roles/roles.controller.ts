import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { RolesService } from './roles.service';
import { CreateRoleDto, RolePermissionDto, RolePermissionResponseDto } from './dto';
import { ROLE_PATTERNS } from '@repo/common';

@Controller()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @MessagePattern(ROLE_PATTERNS.GET_ALL)
  async getAllRoles(): Promise<any> {
    return this.rolesService.getAllRolesWithPermissions();
  }

  @MessagePattern(ROLE_PATTERNS.CREATE)
  async createRole(@Payload() createRoleDto: CreateRoleDto): Promise<any> {
    return this.rolesService.createRole(createRoleDto);
  }

  @MessagePattern(ROLE_PATTERNS.UPDATE)
  async updateRole(
    @Payload() payload: { role_id: number; name?: string; description?: string },
  ): Promise<any> {
    return this.rolesService.updateRole(payload.role_id, {
      name: payload.name,
      description: payload.description,
    });
  }

  @MessagePattern(ROLE_PATTERNS.DELETE)
  async deleteRole(@Payload() payload: { role_id: number }): Promise<any> {
    return this.rolesService.deleteRole(payload.role_id);
  }

  @MessagePattern(ROLE_PATTERNS.ASSIGN_PERMISSIONS)
  async assignRolePermissions(
    @Payload() rolePermissionDto: RolePermissionDto,
  ): Promise<RolePermissionResponseDto> {
    return this.rolesService.assignRolePermissions(rolePermissionDto);
  }
}
