import { Controller, Get, Inject, Injectable, Post } from '@nestjs/common';
import { PostsService } from './posts.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PostsDto } from '../dto/post-response.dto';

@Controller('posts')
export class PostsController {
  constructor(@Inject(PostsService) private readonly postsService: PostsService) {}

  @Get('hello')
  getHello(): string {
    return 'Hello from Posts Controller!';
  }

  @MessagePattern('posts.add_new_post')
  async addNewPost(@Payload() newPost: PostsDto) {
    return this.postsService.addNewPost(newPost.class_id, newPost.message, newPost.sender_id, newPost.parent_id, newPost.title);
  }
}
