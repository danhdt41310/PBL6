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
  async createRole(
    @Payload() payload: CreateRoleDto & { actorInfo?: { userId: number; email: string; fullName: string } },
  ): Promise<any> {
    const { actorInfo, ...createRoleDto } = payload;
    return this.rolesService.createRole(createRoleDto, actorInfo);
  }

  @MessagePattern(ROLE_PATTERNS.UPDATE)
  async updateRole(
    @Payload() payload: {
      role_id: number;
      displayText?: string;
      description?: string;
      actorInfo?: { userId: number; email: string; fullName: string };
    },
  ): Promise<any> {
    const { role_id, displayText, description, actorInfo } = payload;
    return this.rolesService.updateRole(role_id, { displayText, description }, actorInfo);
  }

  @MessagePattern(ROLE_PATTERNS.DELETE)
  async deleteRole(
    @Payload() payload: { 
      role_id: number;
      actorInfo?: { userId: number; email: string; fullName: string };
    },
  ): Promise<any> {
    const { role_id, actorInfo } = payload;
    return this.rolesService.deleteRole(role_id, actorInfo);
  }

  @MessagePattern(ROLE_PATTERNS.ASSIGN_PERMISSIONS)
  async assignRolePermissions(
    @Payload() payload: RolePermissionDto & { actorInfo?: { userId: number; email: string; fullName: string } },
  ): Promise<RolePermissionResponseDto> {
    const { actorInfo, ...rolePermissionDto } = payload;
    return this.rolesService.assignRolePermissions(rolePermissionDto, actorInfo);
  }
}
