import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';

import { AppController } from './app.controller';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { VerificationCodesModule } from './modules/verification-codes/verification-codes.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { PrismaService } from './shared/prisma/prisma.service';
import { SharedModule } from './shared/shared.module';
import { GlobalRpcExceptionFilter } from '@repo/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    SharedModule,
    UsersModule,
    AuthModule,
    RolesModule,
    PermissionsModule,
    VerificationCodesModule,
    AuditLogsModule,
  ],
  controllers: [AppController],
  providers: [
    PrismaService,
    {
      provide: APP_FILTER,
      useClass: GlobalRpcExceptionFilter,
    },
  ],
  exports: [PrismaService],
})
export class AppModule {}
