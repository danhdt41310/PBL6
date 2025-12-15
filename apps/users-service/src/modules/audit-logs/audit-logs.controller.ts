import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogQueryDto } from './dto';
import { AUDIT_LOG_PATTERNS } from '@repo/common';

@Controller()
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @MessagePattern(AUDIT_LOG_PATTERNS.GET_LOGS)
  async getLogs(@Payload() query: AuditLogQueryDto) {
    return this.auditLogsService.getLogs(query);
  }

  @MessagePattern(AUDIT_LOG_PATTERNS.GET_LOG_BY_ID)
  async getLogById(@Payload() data: { logId: number }) {
    return this.auditLogsService.getLogById(data.logId);
  }

  @MessagePattern(AUDIT_LOG_PATTERNS.GET_USER_ACTIVITY)
  async getUserActivity(@Payload() data: { userId: number; limit?: number }) {
    return this.auditLogsService.getUserActivityHistory(data.userId, data.limit);
  }

  @MessagePattern(AUDIT_LOG_PATTERNS.EXPORT_LOGS)
  async exportLogs(@Payload() query: AuditLogQueryDto) {
    return this.auditLogsService.exportLogs(query);
  }
}
