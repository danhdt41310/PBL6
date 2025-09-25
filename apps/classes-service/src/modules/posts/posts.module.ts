import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [PostsController],
  providers: [PostsService, PrismaService],
  exports: [PostsService],
})
export class PostsModule {}
