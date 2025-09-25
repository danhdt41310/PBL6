import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ExamsController } from './exams.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'EXAMS_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
        },
      },
    ]),
  ],
  controllers: [ExamsController],
  providers: [],
})
export class ExamsModule {}
