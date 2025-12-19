import { Injectable } from '@nestjs/common';
import { Prisma, Role, Permission, RolePermission } from '@prisma/users-client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { BaseRepository } from '@repo/common';

/**
 * Role with permissions and users relation type
 */
export interface RoleWithPermissions extends Role {
  rolePermissions: (RolePermission & {
    permission: Permission;
  })[];
}

/**
 * Role with permissions, users and details relation type
 */
export interface RoleWithDetails extends Role {
  rolePermissions: RolePermission[];
  userRoles: {
    user_role_id: number;
    user_id: number;
    role_id: number;
    user: {
      user_id: number;
      full_name: string;
      email: string;
    };
  }[];
}

/**
 * Role with all relations
 */
export interface RoleWithAllRelations extends Role {
  rolePermissions: (RolePermission & {
    permission: Permission;
  })[];
  userRoles: {
    user_role_id: number;
    user_id: number;
    role_id: number;
    user: {
      user_id: number;
      full_name: string;
      email: string;
    };
  }[];
}

/**
 * Roles Repository
 * Extends BaseRepository with Role-specific operations
 */
@Injectable()
export class RolesRepository extends BaseRepository<
  Role,
  Prisma.RoleCreateInput,
  Prisma.RoleUpdateInput
> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, 'role', 'role_id');
  }

  // ==================== FIND OPERATIONS ====================

  /**
   * Find role by name
   * @param name - Role name
   * @returns Role or null
   */
  async findByName(name: string): Promise<Role | null> {
    return await this.prisma.role.findUnique({
      where: { name },
    });
  }

  /**
   * Find role by name with permissions
   * @param name - Role name
   * @returns Role with permissions or null
   */
  async findByNameWithPermissions(name: string): Promise<RoleWithPermissions | null> {
    return await this.prisma.role.findUnique({
      where: { name },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  /**
   * Find role by ID with details (permissions and users)
   * @param roleId - Role ID
   * @returns Role with details or null
   */
  async findByIdWithDetails(roleId: number): Promise<RoleWithDetails | null> {
    return await this.prisma.role.findUnique({
      where: { role_id: roleId },
      include: {
        rolePermissions: true,
        userRoles: {
          select: {
            user_role_id: true,
            user_id: true,
            role_id: true,
            user: {
              select: {
                user_id: true,
                full_name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find all roles with permissions and users
   * @returns Array of roles with all relations
   */
  async findAllWithPermissions(): Promise<RoleWithAllRelations[]> {
    return await this.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        userRoles: {
          select: {
            user_role_id: true,
            user_id: true,
            role_id: true,
            user: {
              select: {
                user_id: true,
                full_name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  // ==================== CREATE/UPDATE OPERATIONS ====================

  /**
   * Create a new role
   * @param name - Role system name (immutable identifier)
   * @param displayText - Display name for UI (user-facing)
   * @param description - Role description
   * @returns Created role
   */
  async createRole(name: string, displayText: string, description?: string): Promise<Role> {
    return await this.prisma.role.create({
      data: {
        name,
        displayText,
        description: description || `Role: ${displayText}`,
      },
    });
  }

  /**
   * Update role and return with permissions
   * @param roleId - Role ID
   * @param data - Update data
   * @returns Updated role with permissions
   */
  async updateWithPermissions(
    roleId: number,
    data: Prisma.RoleUpdateInput,
  ): Promise<RoleWithPermissions> {
    return await this.prisma.role.update({
      where: { role_id: roleId },
      data,
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  // ==================== ROLE-PERMISSION OPERATIONS ====================

  /**
   * Delete role permissions
   * @param roleId - Role ID
   * @param permissionIds - Optional array of permission IDs to delete
   * @returns Delete result
   */
  async deleteRolePermissions(
    roleId: number,
    permissionIds?: number[],
  ): Promise<Prisma.BatchPayload> {
    const where: Prisma.RolePermissionWhereInput = { role_id: roleId };
    if (permissionIds) {
      where.permission_id = { in: permissionIds };
    }
    return await this.prisma.rolePermission.deleteMany({ where });
  }

  /**
   * Create role permission
   * @param roleId - Role ID
   * @param permissionId - Permission ID
   * @returns Created role permission
   */
  async createRolePermission(
    roleId: number,
    permissionId: number,
  ): Promise<RolePermission> {
    return await this.prisma.rolePermission.create({
      data: {
        role_id: roleId,
        permission_id: permissionId,
      },
    });
  }

  // ==================== TRANSACTION OPERATIONS ====================

  /**
   * Execute operations in a transaction
   * @param fn - Transaction callback function
   * @returns Transaction result
   */
  async runTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return await this.prisma.$transaction(fn);
  }

  /**
   * Transaction-specific: Find role by name with permissions
   * @param tx - Transaction client
   * @param name - Role name
   * @returns Role with permissions or null
   */
  async findByNameWithPermissionsTx(
    tx: Prisma.TransactionClient,
    name: string,
  ): Promise<RoleWithPermissions | null> {
    return await tx.role.findUnique({
      where: { name },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  /**
   * Transaction-specific: Delete role permissions
   * @param tx - Transaction client
   * @param roleId - Role ID
   * @param permissionIds - Permission IDs to delete
   * @returns Delete result
   */
  async deleteRolePermissionsTx(
    tx: Prisma.TransactionClient,
    roleId: number,
    permissionIds: number[],
  ): Promise<Prisma.BatchPayload> {
    return await tx.rolePermission.deleteMany({
      where: {
        role_id: roleId,
        permission_id: {
          in: permissionIds,
        },
      },
    });
  }

  /**
   * Transaction-specific: Create role permission
   * @param tx - Transaction client
   * @param roleId - Role ID
   * @param permissionId - Permission ID
   * @returns Created role permission
   */
  async createRolePermissionTx(
    tx: Prisma.TransactionClient,
    roleId: number,
    permissionId: number,
  ): Promise<RolePermission> {
    return await tx.rolePermission.create({
      data: {
        role_id: roleId,
        permission_id: permissionId,
      },
    });
  }
}
