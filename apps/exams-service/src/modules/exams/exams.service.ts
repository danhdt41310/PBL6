import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.exam.findMany({
      include: {
        submissions: true,
        question_exams: {
          include: {
            question: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const exam = await this.prisma.exam.findUnique({
      where: { exam_id: id },
      include: {
        submissions: true,
        question_exams: {
          include: {
            question: true,
          },
        },
      },
    });
    
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }
    
    return exam;
  }
}
