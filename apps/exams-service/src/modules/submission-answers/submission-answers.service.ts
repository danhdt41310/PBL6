import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubmissionAnswersRepository } from './submission-answers.repository';
import { CreateSubmissionAnswerDto, UpdateSubmissionAnswerDto } from './dto';

@Injectable()
export class SubmissionAnswersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly submissionAnswersRepository: SubmissionAnswersRepository,
  ) {}

  async createSubmissionAnswer(createDto: CreateSubmissionAnswerDto) {
    return this.submissionAnswersRepository.create(createDto);
  }

  async findSubmissionAnswerById(id: number) {
    const submissionAnswer = await this.submissionAnswersRepository.findById(id);

    if (!submissionAnswer) {
      throw new NotFoundException(`Submission answer with ID ${id} not found`);
    }

    return submissionAnswer;
  }

  async updateSubmissionAnswer(id: number, updateDto: UpdateSubmissionAnswerDto) {
    const submissionAnswer = await this.findSubmissionAnswerById(id);
    return this.submissionAnswersRepository.update(id, updateDto);
  }

  async findAnswersBySubmission(submissionId: number) {
    return this.submissionAnswersRepository.findManyBySubmission(submissionId);
  }
}
