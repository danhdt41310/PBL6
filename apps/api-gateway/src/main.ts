import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  // Create HTTP application
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend integration
  app.enableCors({
    origin: true, // In production, specify allowed origins
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Start the application
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 API Gateway is running on port ${port}`);
  console.log(`📋 API Documentation: http://localhost:${port}/api`);
}

bootstrap().catch(err => {
  console.error('Failed to start API Gateway:', err);
  process.exit(1);
});
