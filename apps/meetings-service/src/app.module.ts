import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MeetingAttendeesModule } from './modules/meeting-attendees/meeting-attendees.module';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MeetingsModule,
    MeetingAttendeesModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
