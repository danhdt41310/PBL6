import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubmissionDto, GradeSubmissionDto, StartExamDto, SubmitAnswerDto, UpdateRemainingTimeDto } from './dto';

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createSubmission(createSubmissionDto: CreateSubmissionDto) {
    const { answers, ...submissionData } = createSubmissionDto;
    
    return this.prisma.submission.create({
      data: {
        ...submissionData,
        answers: {
          create: answers,
        },
      },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
        exam: true,
      },
    });
  }

  async findSubmissionsByExam(examId: number) {
    return this.prisma.submission.findMany({
      where: { exam_id: examId },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
        exam: true,
      },
    });
  }

  async findSubmissionById(id: number) {
    const submission = await this.prisma.submission.findUnique({
      where: { submission_id: id },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
        exam: true,
      },
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }

    return submission;
  }

  async findSubmissionsByStudent(studentId: number, examId?: number) {
    return this.prisma.submission.findMany({
      where: {
        student_id: studentId,
        ...(examId && { exam_id: examId }),
      },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
        exam: true,
      },
    });
  }

  async gradeSubmission(submissionId: number, gradeData: GradeSubmissionDto) {
    const submission = await this.findSubmissionById(submissionId);
    
    return this.prisma.submission.update({
      where: { submission_id: submissionId },
      data: {
        score: gradeData.score,
        teacher_feedback: gradeData.teacher_feedback,
        graded_by: gradeData.graded_by,
        graded_at: new Date(),
      },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
        exam: true,
      },
    });
  }

  /**
   * Start or resume an exam for a student
   * Creates a new submission or returns existing one if already started
   * Returns the first question (order = 1)
   */
  async startExam(examId: number, studentId: number) {
    // Check if exam exists
    const exam = await this.prisma.exam.findUnique({
      where: { exam_id: examId },
      include: {
        question_exams: {
          orderBy: { order: 'asc' },
          include: {
            question: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${examId} not found`);
    }

    // Check if exam has questions
    if (!exam.question_exams || exam.question_exams.length === 0) {
      throw new BadRequestException('Exam has no questions');
    }

    // Check if submission already exists
    let submission = await this.prisma.submission.findUnique({
      where: {
        exam_id_student_id: {
          exam_id: examId,
          student_id: studentId,
        },
      },
      include: {
        answers: true,
      },
    });

    // Create new submission if doesn't exist
    if (!submission) {
      const totalTimeInSeconds = exam.total_time * 60;
      submission = await this.prisma.submission.create({
        data: {
          exam_id: examId,
          student_id: studentId,
          current_question_order: 1,
          remaining_time: totalTimeInSeconds,
          status: 'in_progress',
        } as any,
        include: {
          answers: true,
        },
      });
    }

    // Check if submission is already submitted
    if (submission.status === 'submitted' || submission.status === 'graded') {
      throw new BadRequestException('Exam has already been submitted');
    } 

    console.log("Submission found or created:", submission);
    console.log('Current Question Order:', submission.current_question_order);

    // Get the current question
    const currentQuestion = exam.question_exams[submission.current_question_order - 1 || 0];

    return {
      submission_id: submission.submission_id,
      exam_id: exam.exam_id,
      exam_title: exam.title,
      student_id: submission.student_id,
      current_question_order: (submission as any).current_question_order,
      remaining_time: (submission as any).remaining_time,
      total_questions: exam.question_exams.length,
      question: {
        question_id: currentQuestion.question.question_id,
        order: currentQuestion.order,
        points: currentQuestion.points,
        content: currentQuestion.question.content,
        type: currentQuestion.question.type,
        difficulty: currentQuestion.question.difficulty,
        is_multiple_answer: currentQuestion.question.is_multiple_answer,
        options: currentQuestion.question.options,
        category: currentQuestion.question.category,
      },
    };
  }

  /**
   * Get a specific question by order for a submission
   * Returns the question details and existing answer if available
   * Also updates the current_question_order to track progress
   */
  async getQuestionByOrder(submissionId: number, order: number) {
    // Get submission
    const submission = await this.prisma.submission.findUnique({
      where: { submission_id: submissionId },
      include: {
        exam: {
          include: {
            question_exams: {
              where: { order },
              include: {
                question: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${submissionId} not found`);
    }

    // Check if question exists at this order
    const questionExam = submission.exam.question_exams[0];
    if (!questionExam) {
      throw new NotFoundException(`Question with order ${order} not found in this exam`);
    }

    // Update current_question_order to track which question the student is viewing
    await this.prisma.submission.update({
      where: { submission_id: submissionId },
      data: {
        current_question_order: order,
      },
    });

    // Find existing answer for this question
    const existingAnswer = submission.answers.find(
      (answer) => answer.question_id === questionExam.question.question_id
    );

    // Get total questions count
    const totalQuestions = await this.prisma.questionExam.count({
      where: { exam_id: submission.exam_id },
    });

    return {
      submission_id: submission.submission_id,
      current_question_order: order,
      remaining_time: (submission as any).remaining_time,
      total_questions: totalQuestions,
      question: {
        question_id: questionExam.question.question_id,
        order: questionExam.order,
        points: questionExam.points,
        content: questionExam.question.content,
        type: questionExam.question.type,
        difficulty: questionExam.question.difficulty,
        is_multiple_answer: questionExam.question.is_multiple_answer,
        options: questionExam.question.options,
        category: questionExam.question.category,
      },
      existing_answer: existingAnswer
        ? {
            answer_id: existingAnswer.answer_id,
            answer_content: existingAnswer.answer_content,
          }
        : null,
    };
  }

  /**
   * Submit or update an answer for a question
   */
  async submitAnswer(submissionId: number, submitAnswerDto: SubmitAnswerDto) {
    // Verify submission exists and is in progress
    const submission = await this.prisma.submission.findUnique({
      where: { submission_id: submissionId },
      include: {
        exam: {
          include: {
            question_exams: {
              where: { question_id: submitAnswerDto.question_id },
            },
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${submissionId} not found`);
    }

    if (submission.status !== 'in_progress') {
      throw new BadRequestException('Cannot submit answer: submission is not in progress');
    }

    // Verify question belongs to this exam
    if (submission.exam.question_exams.length === 0) {
      throw new BadRequestException('Question does not belong to this exam');
    }

    // Check if answer already exists
    const existingAnswer = await this.prisma.submissionAnswer.findFirst({
      where: {
        submission_id: submissionId,
        question_id: submitAnswerDto.question_id,
      },
    });

    let answer;
    if (existingAnswer) {
      // Update existing answer
      answer = await this.prisma.submissionAnswer.update({
        where: { answer_id: existingAnswer.answer_id },
        data: {
          answer_content: submitAnswerDto.answer_content,
        },
      });
    } else {
      // Create new answer
      answer = await this.prisma.submissionAnswer.create({
        data: {
          submission_id: submissionId,
          question_id: submitAnswerDto.question_id,
          answer_content: submitAnswerDto.answer_content,
        },
      });
    }

    return {
      answer_id: answer.answer_id,
      question_id: answer.question_id,
      answer_content: answer.answer_content,
      message: existingAnswer ? 'Answer updated successfully' : 'Answer submitted successfully',
    };
  }

  /**
   * Resume exam - get current question based on current_question_order
   */
  async resumeExam(submissionId: number) {
    const submission = await this.prisma.submission.findUnique({
      where: { submission_id: submissionId },
      include: {
        exam: {
          include: {
            question_exams: {
              orderBy: { order: 'asc' },
              include: {
                question: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${submissionId} not found`);
    }

    if (submission.status === 'submitted' || submission.status === 'graded') {
      throw new BadRequestException('Exam has already been submitted');
    }

    // Find the question at current_question_order
    const currentQuestionExam = submission.exam.question_exams.find(
      (qe) => qe.order === (submission as any).current_question_order
    );

    if (!currentQuestionExam) {
      throw new NotFoundException(
        `Question with order ${(submission as any).current_question_order} not found`
      );
    }

    // Find existing answer for current question
    const existingAnswer = submission.answers.find(
      (answer) => answer.question_id === currentQuestionExam.question.question_id
    );

    return {
      submission_id: submission.submission_id,
      exam_id: submission.exam_id,
      exam_title: submission.exam.title,
      student_id: submission.student_id,
      current_question_order: (submission as any).current_question_order,
      remaining_time: (submission as any).remaining_time,
      total_questions: submission.exam.question_exams.length,
      answered_count: submission.answers.length,
      question: {
        question_id: currentQuestionExam.question.question_id,
        order: currentQuestionExam.order,
        points: currentQuestionExam.points,
        content: currentQuestionExam.question.content,
        type: currentQuestionExam.question.type,
        difficulty: currentQuestionExam.question.difficulty,
        is_multiple_answer: currentQuestionExam.question.is_multiple_answer,
        options: currentQuestionExam.question.options,
        category: currentQuestionExam.question.category,
      },
      existing_answer: existingAnswer
        ? {
            answer_id: existingAnswer.answer_id,
            answer_content: existingAnswer.answer_content,
          }
        : null,
    };
  }

  /**
   * Submit the entire exam - mark as submitted
   */
  async submitExam(submissionId: number) {
    const submission = await this.prisma.submission.findUnique({
      where: { submission_id: submissionId },
      include: {
        answers: true,
        exam: {
          include: {
            question_exams: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${submissionId} not found`);
    }

    if (submission.status === 'submitted' || submission.status === 'graded') {
      throw new BadRequestException('Exam has already been submitted');
    }

    // Update submission status
    const updatedSubmission = await this.prisma.submission.update({
      where: { submission_id: submissionId },
      data: {
        status: 'submitted',
        submitted_at: new Date(),
      },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
        exam: true,
      },
    });

    return {
      submission_id: updatedSubmission.submission_id,
      exam_id: updatedSubmission.exam_id,
      student_id: updatedSubmission.student_id,
      status: updatedSubmission.status,
      submitted_at: updatedSubmission.submitted_at,
      total_questions: submission.exam.question_exams.length,
      answered_questions: updatedSubmission.answers.length,
      message: 'Exam submitted successfully',
    };
  }

  /**
   * Update remaining time for a submission
   */
  async updateRemainingTime(submissionId: number, updateTimeDto: UpdateRemainingTimeDto) {
    const submission = await this.prisma.submission.findUnique({
      where: { submission_id: submissionId },
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${submissionId} not found`);
    }

    if (submission.status !== 'in_progress') {
      throw new BadRequestException('Cannot update time: submission is not in progress');
    }

    const updatedSubmission = await this.prisma.submission.update({
      where: { submission_id: submissionId },
      data: {
        remaining_time: updateTimeDto.remaining_time,
      } as any,
    });

    return {
      submission_id: updatedSubmission.submission_id,
      remaining_time: (updatedSubmission as any).remaining_time,
      message: 'Remaining time updated successfully',
    };
  }
}
