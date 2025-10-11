import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { RpcExceptionFilter } from 'src/common/filters';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.REDIS,
      options: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    },
  );

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new RpcExceptionFilter())

  await app.listen();
  
  console.log(`Users Microservice connected to Redis`);
  console.log(`RpcExceptionFilter applied via APP_FILTER provider`);
}
bootstrap();
