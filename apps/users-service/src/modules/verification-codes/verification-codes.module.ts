import { Module } from '@nestjs/common';
import { VerificationCodesService } from './verification-codes.service';
import { VerificationCodesRepository } from './verification-codes.repository';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Module({
  providers: [VerificationCodesService, VerificationCodesRepository, PrismaService],
  exports: [VerificationCodesService, VerificationCodesRepository],
})
export class VerificationCodesModule {}
