import { Injectable } from '@nestjs/common';

import { PermissionsRepository } from './permissions.repository';
import { CreatePermissionDto } from './dto';
import { PERMISSION_SUCCESS } from './constants';
import { PermissionAlreadyExistsException } from './exceptions';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly permissionsRepository: PermissionsRepository,
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
  async createPermission(createPermissionDto: CreatePermissionDto): Promise<any> {
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
