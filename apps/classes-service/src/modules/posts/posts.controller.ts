import { Controller, Get, Inject, Injectable, Post } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { PostsService } from "./posts.service";

@Controller("posts")
export class PostsController {
  constructor(
    @Inject(PostsService) private readonly postsService: PostsService
  ) {}

  @Get("hello")
  getHello(): string {
    return "Hello from Posts Controller!";
  }

  @MessagePattern("posts.create")
  async createPost(
    @Payload()
    data: {
      class_id: number;
      sender_id: number;
      message: string;
      title?: string;
      parent_id?: number;
    }
  ) {
    return await this.postsService.addNewPost(
      data.class_id,
      data.message,
      data.sender_id,
      data.parent_id,
      data.title
    );
  }
}
