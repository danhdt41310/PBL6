import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MeetingsController } from './meetings.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MEETINGS_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
        },
      },
    ]),
  ],
  controllers: [MeetingsController],
  providers: [],
})
export class MeetingsModule {}
