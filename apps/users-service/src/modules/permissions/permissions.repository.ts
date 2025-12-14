import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/users-client';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class PermissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find permission by key
   */
  async findByKey(key: string) {
    return this.prisma.permission.findUnique({
      where: { key },
    });
  }

  /**
   * Find all permissions
   */
  async findAll() {
    return this.prisma.permission.findMany({
      orderBy: {
        key: 'asc',
      },
    });
  }

  /**
   * Create a new permission
   */
  async create(data: Prisma.PermissionCreateInput) {
    return this.prisma.permission.create({
      data,
    });
  }

  /**
   * Transaction-specific: Find permission by key
   */
  async findByKeyTx(tx: Prisma.TransactionClient, key: string) {
    return tx.permission.findUnique({
      where: { key },
    });
  }
}
