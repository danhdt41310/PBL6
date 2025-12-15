import { AuditLogResource } from '@prisma/users-client';

export class CreateAuditLogDto {
  action: string;
  resource: AuditLogResource;
  description?: string;
  actorId: number;
  actorEmail: string;
  actorName: string;
  targetId?: string;
  targetType?: string;
  oldData?: any;
  newData?: any;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  requestPath?: string;
  metadata?: any;
}
