import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class MeetingAttendeesModule {}
