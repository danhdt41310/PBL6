import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.post.findMany({
      include: {
        class: true,
        materials: true,
      },
    });
  }
}
