import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.material.findMany({
      include: {
        post: true,
      },
    });
  }
}
