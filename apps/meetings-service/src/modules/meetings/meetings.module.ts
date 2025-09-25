import { Module } from '@nestjs/common';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [MeetingsController],
  providers: [MeetingsService, PrismaService],
  exports: [MeetingsService],
})
export class MeetingsModule {}
