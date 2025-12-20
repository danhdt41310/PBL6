import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport, RpcException } from '@nestjs/microservices';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { GlobalRpcExceptionFilter } from '@repo/common';

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

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Auto-convert types (string to number, etc.)
      },
      exceptionFactory: (errors) => {
        // Format validation errors for RPC
        const messages = errors
          .map((error) => Object.values(error.constraints || {}))
          .flat();
        return new RpcException({
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          message: messages,
          error: 'Validation Failed',
        });
      },
    }),
  );

  app.useGlobalFilters(new GlobalRpcExceptionFilter());

  await app.listen();

  console.log('Users Microservice connected to Redis');
}
bootstrap();
