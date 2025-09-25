import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ClassesController } from './classes.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'CLASSES_SERVICE',
        transport: Transport.REDIS, 
        options: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
        },
      },
    ]),
  ],
  controllers: [ClassesController],
  providers: [],
})
export class ClassesModule {}
