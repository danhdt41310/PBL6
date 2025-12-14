import { Injectable } from '@nestjs/common';

import { RolesRepository } from './roles.repository';
import { PermissionsRepository } from '../permissions/permissions.repository';
import {
  CreateRoleDto,
  UpdateRoleDto,
  RolePermissionDto,
  RolePermissionResponseDto,
} from './dto';

import { ROLE_SUCCESS } from './constants';
import {
  RoleNotFoundException,
  RoleNotFoundByIdException,
  RoleAlreadyExistsException,
  RoleHasUsersException,
} from './exceptions';
import { PermissionNotFoundException } from '../permissions/exceptions';

@Injectable()
export class RolesService {
  constructor(
    private readonly rolesRepository: RolesRepository,
    private readonly permissionsRepository: PermissionsRepository,
  ) {}

  /**
   * Get all roles with permissions
   */
  async getAllRolesWithPermissions(): Promise<any> {
    const roles = await this.rolesRepository.findAllWithPermissions();

    const mappedRoles = roles.map((role) => ({
      role_id: role.role_id,
      name: role.name,
      description: role.description,
      created_at: role.created_at,
      permissions: role.rolePermissions.map((rp) => ({
        permission_id: rp.permission.permission_id,
        key: rp.permission.key,
        name: rp.permission.name,
        description: rp.permission.description,
        resource: rp.permission.resource,
        action: rp.permission.action,
      })),
      userRoles: role.userRoles.map((ur) => ({
        user_role_id: ur.user_role_id,
        user_id: ur.user_id,
        role_id: ur.role_id,
        user: ur.user,
      })),
    }));

    return {
      message: ROLE_SUCCESS.FETCHED,
      roles: mappedRoles,
    };
  }

  /**
   * Create a new role
   */
  async createRole(createRoleDto: CreateRoleDto): Promise<any> {
    const { name, description } = createRoleDto;
    
    const existingRole = await this.rolesRepository.findByName(name);

    if (existingRole) {
      throw new RoleAlreadyExistsException(name);
    }

    const role = await this.rolesRepository.createRole(name, description);

    return {
      message: ROLE_SUCCESS.CREATED_WITH_NAME(name),
      success: true,
      role: {
        role_id: role.role_id,
        name: role.name,
        description: role.description,
        created_at: role.created_at,
      },
    };
  }

  /**
   * Update a role
   */
  async updateRole(roleId: number, updateRoleDto: UpdateRoleDto): Promise<any> {
    const role = await this.rolesRepository.findById(roleId);

    if (!role) {
      throw new RoleNotFoundByIdException(roleId);
    }

    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.rolesRepository.findByName(updateRoleDto.name);
      if (existingRole) {
        throw new RoleAlreadyExistsException(updateRoleDto.name);
      }
    }

    const updatedRole = await this.rolesRepository.update(roleId, {
      ...(updateRoleDto.name && { name: updateRoleDto.name }),
      ...(updateRoleDto.description !== undefined && { description: updateRoleDto.description }),
    });

    return {
      message: ROLE_SUCCESS.UPDATED_WITH_NAME(updatedRole.name),
      success: true,
      data: updatedRole,
    };
  }

  /**
   * Delete a role
   */
  async deleteRole(roleId: number): Promise<any> {
    const role = await this.rolesRepository.findByIdWithDetails(roleId);

    if (!role) {
      throw new RoleNotFoundByIdException(roleId);
    }

    if (role.userRoles && role.userRoles.length > 0) {
      throw new RoleHasUsersException(role.name, role.userRoles.length);
    }

    if (role.rolePermissions && role.rolePermissions.length > 0) {
      await this.rolesRepository.deleteRolePermissions(roleId);
    }

    await this.rolesRepository.delete(roleId);

    return {
      message: ROLE_SUCCESS.DELETED_WITH_NAME(role.name),
      success: true,
    };
  }

  /**
   * Assign permissions to a role
   */
  async assignRolePermissions(rolePermissionDto: RolePermissionDto): Promise<RolePermissionResponseDto> {
    const { roleName, permissionNames } = rolePermissionDto;

    try {
      return await this.rolesRepository.runTransaction(async (tx) => {
        const role = await this.rolesRepository.findByNameWithPermissionsTx(tx, roleName);

        if (!role) {
          throw new RoleNotFoundException(roleName);
        }

        const currentPermissionKeys = role.rolePermissions.map((rp) => rp.permission.key);

        const permissionsToAdd = permissionNames.filter((key) => !currentPermissionKeys.includes(key));
        const permissionsToRemove = currentPermissionKeys.filter((key) => !permissionNames.includes(key));

        if (permissionsToRemove.length > 0) {
          const permissionIdsToRemove = role.rolePermissions
            .filter((rp) => permissionsToRemove.includes(rp.permission.key))
            .map((rp) => rp.permission.permission_id);

          await this.rolesRepository.deleteRolePermissionsTx(tx, role.role_id, permissionIdsToRemove);
        }

        for (const permissionKey of permissionsToAdd) {
          const permission = await this.permissionsRepository.findByKeyTx(tx, permissionKey);

          if (!permission) {
            throw new PermissionNotFoundException(permissionKey);
          }

          await this.rolesRepository.createRolePermissionTx(tx, role.role_id, permission.permission_id);
        }

        return {
          message: ROLE_SUCCESS.PERMISSIONS_UPDATED(roleName, permissionsToAdd.length, permissionsToRemove.length),
          success: true,
          roleName: roleName,
          permissionsAssigned: permissionNames,
          stats: {
            added: permissionsToAdd.length,
            removed: permissionsToRemove.length,
            total: permissionNames.length,
          },
        };
      });
    } catch (error) {
      if (error instanceof RoleNotFoundException || error instanceof PermissionNotFoundException) {
        throw error;
      }
      throw new Error('Failed to assign permissions to role');
    }
  }
}
