import { Global, Module } from '@nestjs/common';
import { EmailModule } from './email/email.module';
import { PrismaModule } from './prisma/prisma.module';

@Global()
@Module({
  imports: [EmailModule, PrismaModule],
  exports: [EmailModule, PrismaModule],
})
export class SharedModule {}