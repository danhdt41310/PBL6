import { Injectable } from '@nestjs/common';
import { AuditLogResource } from '@prisma/users-client';
import { AuditLogsRepository } from './audit-logs.repository';
import { CreateAuditLogDto, AuditLogQueryDto, AuditLogListResponseDto } from './dto';

@Injectable()
export class AuditLogsService {
  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

  /**
   * Create a new audit log entry
   * This method should not throw - logging failures should not affect main operations
   */
  async createLog(data: CreateAuditLogDto): Promise<void> {
    try {
      await this.auditLogsRepository.create({
        action: data.action,
        resource: data.resource,
        description: data.description,
        actor_email: data.actorEmail,
        actor_name: data.actorName,
        target_id: data.targetId,
        target_type: data.targetType,
        old_data: data.oldData,
        new_data: data.newData,
        changes: data.changes,
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        request_method: data.requestMethod,
        request_path: data.requestPath,
        metadata: data.metadata,
        actor: {
          connect: { user_id: data.actorId },
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Get audit logs with filters and pagination
   */
  async getLogs(query: AuditLogQueryDto): Promise<AuditLogListResponseDto> {
    const { page = 1, limit = 20, ...filters } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.action) where.action = filters.action;
    if (filters.resource) where.resource = filters.resource;
    if (filters.actorId) where.actor_id = filters.actorId;
    if (filters.targetId) where.target_id = filters.targetId;

    if (filters.startDate || filters.endDate) {
      where.created_at = {};
      if (filters.startDate) where.created_at.gte = new Date(filters.startDate);
      if (filters.endDate) where.created_at.lte = new Date(filters.endDate);
    }

    if (filters.search) {
      where.OR = [
        { actor_email: { contains: filters.search, mode: 'insensitive' } },
        { actor_name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      this.auditLogsRepository.findMany({
        where,
        skip,
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
      }),
      this.auditLogsRepository.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single audit log by ID
   */
  async getLogById(logId: number): Promise<any> {
    return this.auditLogsRepository.findById(logId);
  }

  /**
   * Get user activity history
   */
  async getUserActivityHistory(userId: number, limit: number = 50): Promise<any> {
    return this.auditLogsRepository.findByActorId(userId, limit);
  }

  /**
   * Export audit logs (returns data for CSV/Excel)
   */
  async exportLogs(query: AuditLogQueryDto): Promise<any[]> {
    const { startDate, endDate, action, resource } = query;

    const where: any = {};
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = new Date(startDate);
      if (endDate) where.created_at.lte = new Date(endDate);
    }

    return this.auditLogsRepository.findMany({
      where,
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

  /**
   * Helper method to create log from service context
   */
  async logAction(
    action: string,
    resource: AuditLogResource,
    actorInfo: { userId: number; email: string; fullName: string },
    options?: {
      description?: string;
      targetId?: string;
      targetType?: string;
      oldData?: any;
      newData?: any;
      changes?: any;
      ipAddress?: string;
      userAgent?: string;
    },
  ): Promise<void> {
    await this.createLog({
      action,
      resource,
      description: options?.description,
      actorId: actorInfo.userId,
      actorEmail: actorInfo.email,
      actorName: actorInfo.fullName,
      targetId: options?.targetId,
      targetType: options?.targetType,
      oldData: options?.oldData,
      newData: options?.newData,
      changes: options?.changes,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
    });
  }
}
