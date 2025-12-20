import { Module } from '@nestjs/common';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogsRepository } from './audit-logs.repository';
import { UsersRepository } from '../users/users.repository';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Module({
  controllers: [AuditLogsController],
  providers: [AuditLogsService, AuditLogsRepository, UsersRepository, PrismaService],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
