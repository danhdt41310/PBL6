import { Injectable } from '@nestjs/common';
import { AuditLogResource } from '@prisma/users-client';

import { PermissionsRepository } from './permissions.repository';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AUDIT_LOG_ACTIONS } from '../audit-logs/constants';
import { CreatePermissionDto } from './dto';
import { PERMISSION_SUCCESS } from './constants';
import { PermissionAlreadyExistsException } from './exceptions';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly permissionsRepository: PermissionsRepository,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<any> {
    const permissions = await this.permissionsRepository.findAll();

    return {
      message: PERMISSION_SUCCESS.FETCHED,
      permissions: permissions.map((permission) => ({
        permission_id: permission.permission_id,
        key: permission.key,
        name: permission.name,
        description: permission.description,
        resource: permission.resource,
        action: permission.action,
        created_at: permission.created_at,
      })),
    };
  }

  /**
   * Create a new permission
   */
  async createPermission(
    createPermissionDto: CreatePermissionDto,
    actorInfo?: { userId: number; email: string; fullName: string },
  ): Promise<any> {
    const { key, name, description, resource, action } = createPermissionDto;

    const existingPermission = await this.permissionsRepository.findByKey(key);

    if (existingPermission) {
      throw new PermissionAlreadyExistsException(key);
    }

    let finalResource = resource;
    let finalAction = action;

    if (!resource || !action) {
      const parts = key.split('.');
      finalAction = finalAction || parts[0] || 'access';
      finalResource = finalResource || parts.slice(1).join('.') || key;
    }

    const permission = await this.permissionsRepository.create({
      key,
      name: name || key.replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      description: description || `Permission: ${key}`,
      resource: finalResource,
      action: finalAction,
    });

    // Log permission creation - only if actorInfo is provided
    if (actorInfo) {
      await this.auditLogsService.logAction(
        AUDIT_LOG_ACTIONS.PERMISSION_CREATED,
        AuditLogResource.PERMISSION,
        {
          actorId: actorInfo.userId,
          actorEmail: actorInfo.email,
          actorName: actorInfo.fullName,
          targetId: permission.permission_id.toString(),
          targetType: 'PERMISSION',
          newData: {
            permission_id: permission.permission_id,
            key: permission.key,
            name: permission.name,
            description: permission.description,
            resource: permission.resource,
            action: permission.action,
          },
          description: `Created new permission: ${permission.key}`,
        },
      );
    }

    return {
      message: PERMISSION_SUCCESS.CREATED,
      success: true,
      permission: {
        permission_id: permission.permission_id,
        key: permission.key,
        name: permission.name,
        description: permission.description,
        resource: permission.resource,
        action: permission.action,
        created_at: permission.created_at,
      },
    };
  }
}
