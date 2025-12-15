import { AuditLogResource } from '@prisma/users-client';

export class AuditLogQueryDto {
  page?: number;
  limit?: number;
  action?: string;
  resource?: AuditLogResource;
  actorId?: number;
  targetId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}
