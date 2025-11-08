import { Controller, Get, Inject, Injectable, Post } from '@nestjs/common';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(@Inject(PostsService) private readonly postsService: PostsService) {}

  @Get('hello')
  getHello(): string {
    return 'Hello from Posts Controller!';
  }

}
