import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/users-client';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class AuditLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new audit log entry
   */
  async create(data: Prisma.AuditLogCreateInput) {
    return this.prisma.auditLog.create({ data });
  }

  /**
   * Find many audit logs with filters
   */
  async findMany(params: {
    where?: Prisma.AuditLogWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.AuditLogOrderByWithRelationInput;
    include?: Prisma.AuditLogInclude;
  }) {
    return this.prisma.auditLog.findMany({
      where: params.where,
      skip: params.skip,
      take: params.take,
      orderBy: params.orderBy || { created_at: 'desc' },
      include: params.include,
    });
  }

  /**
   * Count audit logs with filters
   */
  async count(params: { where?: Prisma.AuditLogWhereInput }): Promise<number> {
    return this.prisma.auditLog.count({ where: params.where });
  }

  /**
   * Find audit log by ID
   */
  async findById(logId: number) {
    return this.prisma.auditLog.findUnique({
      where: { log_id: logId },
      include: {
        actor: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  /**
   * Find audit logs by actor ID
   */
  async findByActorId(actorId: number, limit: number = 50) {
    return this.prisma.auditLog.findMany({
      where: { actor_id: actorId },
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        actor: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }
}
