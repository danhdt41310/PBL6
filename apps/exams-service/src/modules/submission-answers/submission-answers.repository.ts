import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubmissionAnswerDto, UpdateSubmissionAnswerDto } from './dto';

@Injectable()
export class SubmissionAnswersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateSubmissionAnswerDto) {
    return this.prisma.submissionAnswer.create({
      data: createDto,
      include: {
        submission: true,
        question: true,
      },
    });
  }

  async findById(id: number) {
    return this.prisma.submissionAnswer.findUnique({
      where: { answer_id: id },
      include: {
        submission: true,
        question: true,
      },
    });
  }

  async update(id: number, updateDto: UpdateSubmissionAnswerDto) {
    return this.prisma.submissionAnswer.update({
      where: { answer_id: id },
      data: updateDto,
      include: {
        submission: true,
        question: true,
      },
    });
  }

  async findManyBySubmission(submissionId: number) {
    return this.prisma.submissionAnswer.findMany({
      where: { submission_id: submissionId },
      include: {
        question: true,
      },
    });
  }
}
