import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubmissionAnswerDto, UpdateSubmissionAnswerDto } from './dto';

@Injectable()
export class SubmissionAnswersService {
  constructor(private readonly prisma: PrismaService) {}

  async createSubmissionAnswer(createDto: CreateSubmissionAnswerDto) {
    return this.prisma.submissionAnswer.create({
      data: createDto,
      include: {
        submission: true,
        question: true,
      },
    });
  }

  async findSubmissionAnswerById(id: number) {
    const submissionAnswer = await this.prisma.submissionAnswer.findUnique({
      where: { answer_id: id },
      include: {
        submission: true,
        question: true,
      },
    });

    if (!submissionAnswer) {
      throw new NotFoundException(`Submission answer with ID ${id} not found`);
    }

    return submissionAnswer;
  }

  async updateSubmissionAnswer(id: number, updateDto: UpdateSubmissionAnswerDto) {
    const submissionAnswer = await this.findSubmissionAnswerById(id);
    return this.prisma.submissionAnswer.update({
      where: { answer_id: id },
      data: updateDto,
      include: {
        submission: true,
        question: true,
      },
    });
  }

  async findAnswersBySubmission(submissionId: number) {
    return this.prisma.submissionAnswer.findMany({
      where: { submission_id: submissionId },
      include: {
        question: true,
      },
    });
  }
}
