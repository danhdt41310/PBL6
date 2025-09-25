import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Create hybrid application that supports both HTTP and microservice
  const app = await NestFactory.create(AppModule);
  
  // Connect microservice for internal communication
  const microservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
    },
  });

  // Enable validation
  app.useGlobalPipes(new ValidationPipe());

  // Start both HTTP and microservice
  await app.startAllMicroservices();
  await app.listen(process.env.PORT || 3004);
  
  console.log(`Meetings Service is running on port ${process.env.PORT || 3004}`);
  console.log('Meetings Microservice is connected to Redis');
}
bootstrap();
