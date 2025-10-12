import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { PermissionSyncService } from '../scripts/sync-permissions';

export async function syncPermissionsCommand() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const permissionSyncService = app.get(PermissionSyncService);
  
  try {
    await permissionSyncService.syncPermissions();
    console.log('Permission synchronization completed successfully');
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('Error during permission synchronization:', error);
    await app.close();
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  syncPermissionsCommand();
}
