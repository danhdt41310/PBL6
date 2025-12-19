import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/users-client';
import { PrismaService } from '../../shared/prisma/prisma.service';

/**
 * UsersRepository - Data Access Layer for Users
 * Focuses only on User entity operations
 */
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== USER CRUD OPERATIONS ====================

  /**
   * Create a new user
   */
  async create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  /**
   * Create a new user (alias)
   */
  async createUser(data: Prisma.UserCreateInput) {
    return this.create(data);
  }

  /**
   * Find user by ID with roles
   */
  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { user_id: id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Find user by ID with roles (alias)
   */
  async findUserById(userId: number) {
    return this.findById(userId);
  }

  /**
   * Find user by ID (simple - without roles)
   */
  async findUserByIdSimple(userId: number) {
    return this.prisma.user.findUnique({
      where: { user_id: userId },
    });
  }

  /**
   * Find user by ID with roles and permissions
   */
  async findUserByIdWithPermissions(userId: number) {
    return this.prisma.user.findUnique({
      where: { user_id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find user by email with roles
   */
  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Find user by email (simple - without roles)
   */
  async findUserByEmailSimple(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find all users with pagination
   */
  async findAll(where?: Prisma.UserWhereInput, skip?: number, take?: number) {
    return this.prisma.user.findMany({
      where,
      skip,
      take,
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  /**
   * Find all users (alias)
   */
  async findAllUsers(where: Prisma.UserWhereInput, skip?: number, take?: number) {
    return this.findAll(where, skip, take);
  }

  /**
   * Count users
   */
  async count(where?: Prisma.UserWhereInput): Promise<number> {
    return this.prisma.user.count({ where });
  }

  /**
   * Count users (alias)
   */
  async countUsers(where: Prisma.UserWhereInput): Promise<number> {
    return this.count(where);
  }

  /**
   * Update user by ID
   */
  async update(id: number, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { user_id: id },
      data,
    });
  }

  /**
   * Update user by ID (alias)
   */
  async updateUser(userId: number, data: Prisma.UserUpdateInput) {
    return this.update(userId, data);
  }

  /**
   * Update user by ID and return with roles
   */
  async updateUserWithRoles(userId: number, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { user_id: userId },
      data,
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Delete user by ID
   */
  async delete(id: number) {
    return this.prisma.user.delete({
      where: { user_id: id },
    });
  }

  // ==================== USER SEARCH OPERATIONS ====================

  /**
   * Find users by list of emails
   */
  async findUsersByEmails(emails: string[]) {
    return this.prisma.user.findMany({
      where: {
        email: { in: emails },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Find users by list of IDs
   */
  async findUsersByIds(userIds: number[]) {
    return this.prisma.user.findMany({
      where: {
        user_id: { in: userIds },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Find users matching email pattern
   */
  async findUsersByEmailPattern(emailPattern: string, limit: number = 100) {
    return this.prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      where: {
        email: { contains: emailPattern },
      },
      take: limit,
    });
  }

  /**
   * Search users by name or email with optional exclusion
   */
  async searchUsersByNameOrEmail(
    searchPattern: string,
    excludeUserId?: number,
    limit: number = 20,
  ) {
    const whereConditions: any[] = [
      {
        OR: [
          { full_name: { contains: searchPattern, mode: 'insensitive' } },
          { email: { contains: searchPattern, mode: 'insensitive' } },
        ],
      },
      {
        userRoles: {
          some: {
            role: {
              name: { in: ['student', 'teacher'] },
            },
          },
        },
      },
    ];

    if (excludeUserId) {
      whereConditions.push({
        user_id: { not: excludeUserId },
      });
    }

    return this.prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      where: {
        AND: whereConditions,
      },
      take: limit,
      orderBy: [{ full_name: 'asc' }, { email: 'asc' }],
    });
  }

  // ==================== USER-ROLE OPERATIONS ====================

  /**
   * Find role by name
   */
  async findRoleByName(name: string) {
    return this.prisma.role.findUnique({
      where: { name },
    });
  }

  /**
   * Assign role to user
   */
  async createUserRole(userId: number, roleId: number) {
    return this.prisma.userRole.create({
      data: {
        user_id: userId,
        role_id: roleId,
      },
    });
  }

  /**
   * Execute operations in a transaction
   * Ensures all operations succeed or fail together
   * @param fn - Transaction callback function
   * @returns Transaction result
   */
  async transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return await this.prisma.$transaction(fn);
  }
}
