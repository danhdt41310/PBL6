import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MessagesModule } from './modules/messages/messages.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { EventsModule } from './modules/events/events.module';
import { PrismaService } from './prisma/prisma.service';
import { GlobalRpcExceptionFilter } from './common'; 
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventsModule,
    MessagesModule,
    ConversationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_FILTER,
      useClass: GlobalRpcExceptionFilter,
    },
  ],
  exports: [PrismaService],
})
export class AppModule {}
