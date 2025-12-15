import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto';
import { PERMISSION_PATTERNS } from '@repo/common';

@Controller()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @MessagePattern(PERMISSION_PATTERNS.GET_ALL)
  async getAllPermissions(): Promise<any> {
    return this.permissionsService.getAllPermissions();
  }

  @MessagePattern(PERMISSION_PATTERNS.CREATE)
  async createPermission(
    @Payload() createPermissionDto: CreatePermissionDto,
  ): Promise<any> {
    return this.permissionsService.createPermission(createPermissionDto);
  }
}
