import { Injectable } from '@nestjs/common';
import { AuditLogResource } from '@prisma/users-client';
import { AuditLogsRepository } from './audit-logs.repository';
import { UsersRepository } from '../users/users.repository';
import { CreateAuditLogDto, AuditLogQueryDto, AuditLogListResponseDto } from './dto';
import { AUDIT_LOGS_CONFIG } from './constants';

@Injectable()
export class AuditLogsService {
  constructor(
    private readonly auditLogsRepository: AuditLogsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  /**
   * Create a new audit log entry
   * This method should not throw - logging failures should not affect main operations
   */
  async createLog(data: CreateAuditLogDto): Promise<void> {
    try {
      // Validate required actorId
      if (!data.actorId) {
        console.warn('Audit log skipped: actorId is required but not provided', {
          action: data.action,
          resource: data.resource,
        });
        return;
      }

      // Auto-fetch actor info if missing
      let actorEmail = data.actorEmail;
      let actorName = data.actorName;

      if (!actorEmail || !actorName) {
        try {
          const user = await this.usersRepository.findUserByIdSimple(data.actorId);
          if (user) {
            actorEmail = actorEmail || user.email;
            actorName = actorName || user.full_name || user.email;
          }
        } catch (error) {
          console.warn('Failed to fetch actor info, using fallback', {
            actorId: data.actorId,
            error: error.message,
          });
          actorEmail = actorEmail || `user${data.actorId}@system`;
          actorName = actorName || `User ${data.actorId}`;
        }
      }

      // Final validation
      if (!actorEmail || !actorName) {
        console.warn('Audit log skipped: Unable to resolve actor information', {
          action: data.action,
          resource: data.resource,
          actorId: data.actorId,
        });
        return;
      }

      await this.auditLogsRepository.create({
        action: data.action,
        resource: data.resource,
        description: data.description,
        actor_email: actorEmail,
        actor_name: actorName,
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
          connect: { user_id: data.actorId }
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
    const { 
      page = 1, 
      limit = AUDIT_LOGS_CONFIG.DEFAULT_PAGE_SIZE, 
      ...filters 
    } = query;
    
    // Enforce max page size
    const effectiveLimit = Math.min(limit, AUDIT_LOGS_CONFIG.MAX_PAGE_SIZE);
    const skip = (page - 1) * effectiveLimit;

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
        take: effectiveLimit,
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
        limit: effectiveLimit,
        totalPages: Math.ceil(total / effectiveLimit),
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
   * LIMITED to prevent memory issues
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
      take: AUDIT_LOGS_CONFIG.MAX_EXPORT_ROWS, // Hard limit to prevent OOM
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
   * Helper method to create log from service context.
   */
  async logAction(
    action: string,
    resource: AuditLogResource,
    options: {
      actorId?: number;
      actorEmail?: string;
      actorName?: string;
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
    const actorId = options.actorId;
    const actorEmail = options.actorEmail;
    const actorName = options.actorName;

    await this.createLog({
      action,
      resource,
      description: options?.description,
      actorId,
      actorEmail,
      actorName,
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
