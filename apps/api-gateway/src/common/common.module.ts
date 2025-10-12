import { Module, Global } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { PrismaService } from './services/prisma.service';
import { PermissionSyncService } from './scripts/sync-permissions';
import { PermissionsGuard } from './guards/permissions.guard';

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [
    PrismaService,
    PermissionSyncService,
    PermissionsGuard,
  ],
  exports: [
    PrismaService,
    PermissionSyncService,
    PermissionsGuard,
  ],
})
export class CommonModule {}
