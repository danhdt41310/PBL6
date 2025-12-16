import { Module, forwardRef } from '@nestjs/common';

import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { RolesRepository } from './roles.repository';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Module({
  imports: [forwardRef(() => PermissionsModule), AuditLogsModule],
  controllers: [RolesController],
  providers: [RolesService, RolesRepository, PrismaService],
  exports: [RolesService, RolesRepository],
})
export class RolesModule {}
