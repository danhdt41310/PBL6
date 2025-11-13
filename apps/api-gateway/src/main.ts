import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

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

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('API Gateway Documentation')
    .setDescription('The API Gateway for microservices architecture')
    .setVersion('1.0')
    .addTag('users', 'User management endpoints')
    .addTag('classes', 'Class management endpoints')
    .addTag('exams', 'Exam management endpoints')
    .addTag('meetings', 'Meeting management endpoints')
    .addTag('chats', 'Chat management endpoints')
    .addTag('products', 'Product management endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Global error handling middleware
  app.use((err, req, res, next) => {
    console.error('Global error caught:', err);

    // Nếu là NestJS Exception thì xử lý chuẩn
    if (err.getStatus && err.getResponse) {
      return res.status(err.getStatus()).json(err.getResponse());
    }

    // Nếu không phải Exception của Nest
    return res.status(500).json({
      statusCode: 500,
      message: err.message || 'Internal server error',
    });
  })

  // Start the application
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0')
  
  console.log(`🚀 API Gateway is running on port ${port}`);
  console.log(`📋 API Documentation: http://localhost:${port}/api-docs`);
  console.log(`📝 API Endpoints: http://localhost:${port}/api`);
}

bootstrap().catch(err => {
  console.error('Failed to start API Gateway:', err);
  process.exit(1);
});
