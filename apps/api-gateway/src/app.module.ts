import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { ChatsModule } from './chats/chats.module';
import { ClassesModule } from './classes/classes.module';
import { ExamsModule } from './exams/exams.module';
import { MeetingsModule } from './meetings/meetings.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthMiddleware } from './middleware/auth.middleware';
import { CommonModule } from './common/common.module';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import {
  GatewayResponseInterceptor,
  RpcErrorInterceptor,
} from './common/interceptors';
import { AllExceptionsFilter, HttpExceptionFilter } from './common/filters';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({
      global: true,
      secret: process.env.ACCESS_JWT_SECRET || 'keybimat',
      signOptions: { expiresIn: '1h' },
    }),
    ClientsModule.register([
      {
        name: 'USERS_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
        },
      },
      {
        name: 'CHATS_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
        },
      },
      {
        name: 'CLASSES_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
        },
      },
      {
        name: 'EXAMS_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
        },
      },
      {
        name: 'MEETINGS_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
        },
      },
    ]),
    CommonModule,
    UsersModule,
    ProductsModule,
    ChatsModule,
    ClassesModule,
    ExamsModule,
    MeetingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // {
    //   provide: APP_GUARD,
    //   useClass: PermissionsGuard,
    // },
    {
      provide: APP_INTERCEPTOR,
      useClass: RpcErrorInterceptor, // Convert RpcException → HttpException
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: GatewayResponseInterceptor, // Format successful http responses
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter, // Catch all unhandled exceptions
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter, // Handle HttpException - High priority - Run first
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'users/login', method: RequestMethod.POST },
        { path: 'users/create', method: RequestMethod.POST },
        { path: 'users/forgot-password', method: RequestMethod.POST },
        { path: 'users/verify-code', method: RequestMethod.POST },
        { path: 'users/reset-password', method: RequestMethod.POST },
        { path: '/', method: RequestMethod.GET },
        { path: 'users/hello', method: RequestMethod.GET },
        { path: 'admin/*', method: RequestMethod.ALL },
        // for chat bot check
        { path: 'classes/of/:role/:id', method: RequestMethod.GET},
        { path: 'exams/of', method: RequestMethod.POST},
      )
      .forRoutes('*');
  }
}
