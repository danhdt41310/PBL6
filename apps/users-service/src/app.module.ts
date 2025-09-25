import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { UsersModule } from './modules/users/users.module';
import { PrismaService } from './prisma/prisma.service';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
  ],
  controllers: [AppController],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
