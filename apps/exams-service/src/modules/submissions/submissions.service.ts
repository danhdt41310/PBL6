import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubmissionDto, GradeSubmissionDto, StartExamDto, SubmitAnswerDto, UpdateRemainingTimeDto } from './dto';
import { ExamsService } from '../exams/exams.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly examsService: ExamsService,
    @Inject('USERS_SERVICE') private readonly usersService: ClientProxy,
  ) {}

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

  async findSubmissionsByExam(examId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Get total count for pagination metadata
    const total = await this.prisma.submission.count({
      where: { exam_id: examId },
    });

    // Get paginated submissions
    const submissions = await this.prisma.submission.findMany({
      where: { exam_id: examId },
      include: {
        _count: {
          select: { answers: true },
        },
      },
      skip,
      take: limit,
      orderBy: {
        submitted_at: 'desc',
      },
    });

    // Get unique student IDs
    const studentIds = [...new Set(submissions.map(sub => sub.student_id))];

    // Fetch user information from users-service
    let usersMap = new Map<number, any>();
    if (studentIds.length > 0) {
      try {
        const usersResponse = await firstValueFrom(
          this.usersService.send('users.get_list_profile_by_ids', {
            userIds: studentIds,
          })
        );

        // Create a map for quick lookup
        if (usersResponse?.users) {
          usersResponse.users.forEach((user: any) => {
            usersMap.set(user.user_id, user);
          });
        }
      } catch (error) {
        console.error('Error fetching user information:', error);
        // Continue without user information if the service call fails
      }
    }

    // Enrich submissions with user information
    const enrichedSubmissions = submissions.map(submission => {
      const user = usersMap.get(submission.student_id);
      return {
        ...submission,
        student_name: user?.full_name || null,
        student_email: user?.email || null,
      };
    });

    return {
      data: enrichedSubmissions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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

    const usersResponse = await firstValueFrom(
          this.usersService.send('users.get_list_profile_by_ids', {
            userIds: [submission.student_id],
          })
    );
    const user = usersResponse?.users?.[0];
    
    return {
      ...submission,
      student_name: user?.full_name || null,
      student_email: user?.email || null,
    };
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
        status: 'graded',
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
   * Submit the entire exam - mark as submitted and trigger async grading
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

    // Trigger async grading (fire and forget)
    this.calculateSubmissionScore(submissionId).catch((error) => {
      console.error(`Error calculating score for submission ${submissionId}:`, error);
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

  async calculateSubmissionScore(submissionId: number) {
    try {
      // Get submission with all answers and questions
      const submission = await this.prisma.submission.findUnique({
        where: { submission_id: submissionId },
        include: {
          answers: {
            include: {
              question: true,
            },
          },
          exam: {
            include: {
              question_exams: {
                include: {
                  question: true,
                },
              },
            },
          },
        },
      });

      if (!submission) {
        throw new NotFoundException(`Submission with ID ${submissionId} not found`);
      }

      let totalScore = 0;

      // Process each answer
      for (const answer of submission.answers) {
        // Find the question_exam to get points
        const questionExam = submission.exam.question_exams.find(
          (qe) => qe.question_id === answer.question_id
        );

        if (!questionExam) {
          console.warn(`Question ${answer.question_id} not found in exam ${submission.exam_id}`);
          continue;
        }

        const question = answer.question;
        const maxPoints = Number(questionExam.points);
        let pointsEarned = 0;
        let isCorrect = false;

        if (question.type === 'multiple_choice') {
          // Parse options to get correct answers
          const options = question.options as Array<{ id: number; text: string }>;
          const correctAnswerIds = options
            .filter((opt) => opt.text.startsWith('='))
            .map((opt) => opt.id);

          // Parse student answer (assuming it's stored as comma-separated IDs or JSON array)
          let studentAnswerIds: number[] = [];
          try {
            const parsed = JSON.parse(answer.answer_content);
            studentAnswerIds = Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            // If not JSON, try comma-separated
            studentAnswerIds = answer.answer_content
              .split(',')
              .map((id) => parseInt(id.trim()))
              .filter((id) => !isNaN(id));
          }

          if (question.is_multiple_answer) {
            // Multiple answers - must select all correct and no incorrect
            const correctSelected = studentAnswerIds.filter((id) =>
              correctAnswerIds.includes(id)
            );
            const incorrectSelected = studentAnswerIds.filter(
              (id) => !correctAnswerIds.includes(id)
            );

            // Calculate points: each correct adds, each incorrect subtracts
            const pointsPerCorrect = maxPoints / correctAnswerIds.length;
            pointsEarned = correctSelected.length * pointsPerCorrect - incorrectSelected.length * pointsPerCorrect;
            pointsEarned = Math.max(0, pointsEarned); // Minimum is 0

            // Full points only if all correct and no incorrect
            isCorrect = 
              correctSelected.length === correctAnswerIds.length && 
              incorrectSelected.length === 0;
          } else {
            // Single answer - must select the one correct answer
            isCorrect = 
              studentAnswerIds.length === 1 && 
              correctAnswerIds.includes(studentAnswerIds[0]);
            pointsEarned = isCorrect ? maxPoints : 0;
          }
        } else if (question.type === 'essay') {
          // For essay questions, use AI to compare answers
          const correctAnswer = question.options as string || '';
          const studentAnswer = answer.answer_content;

          if (correctAnswer && studentAnswer) {
            try {
              // Get similarity score from AI (0 to 1)
              const similarityScore = await this.examsService.answerCorrectness(
                studentAnswer,
                correctAnswer
              );
              // Calculate points based on similarity
              pointsEarned = maxPoints * similarityScore;
              isCorrect = similarityScore >= 0.8; // Consider correct if 80% similar
            } catch (error) {
              console.error(`Error calculating similarity for answer ${answer.answer_id}:`, error);
              pointsEarned = 0;
              isCorrect = false;
            }
          }
        }

        // Update the answer with score
        await this.prisma.submissionAnswer.update({
          where: { answer_id: answer.answer_id },
          data: {
            is_correct: isCorrect,
            points_earned: pointsEarned,
          },
        });

        totalScore += pointsEarned;
      }

      // Update submission with total score and mark as graded
      await this.prisma.submission.update({
        where: { submission_id: submissionId },
        data: {
          score: totalScore
        },
      });

      console.log(`Submission ${submissionId} graded successfully. Total score: ${totalScore}`);
      return { submissionId, totalScore };
    } catch (error) {
      console.error(`Failed to calculate score for submission ${submissionId}:`, error);
      throw error;
    }
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

  /**
   * Update multiple answers (points and comments)
   */
  async updateSubmissionAnswers(
    submissionId: number,
    answers: Array<{
      answer_id: number;
      points_earned?: number;
      comment?: string;
    }>,
  ) {
    const submission = await this.findSubmissionById(submissionId);

    // Update each answer
    const updatePromises = answers.map((answer) =>
      this.prisma.submissionAnswer.update({
        where: { answer_id: answer.answer_id },
        data: {
          ...(answer.points_earned !== undefined && { points_earned: answer.points_earned }),
          ...(answer.comment !== undefined && { comment: answer.comment }),
        },
      }),
    );

    await Promise.all(updatePromises);

    // Recalculate total score
    const allAnswers = await this.prisma.submissionAnswer.findMany({
      where: { submission_id: submissionId },
    });

    const totalScore = allAnswers.reduce(
      (sum, answer) => sum + Number(answer.points_earned || 0),
      0,
    );

    // Update submission with new score and status
    return this.prisma.submission.update({
      where: { submission_id: submissionId },
      data: {
        score: totalScore,
        status: 'graded',
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
   * Confirm grading (change status to graded without modifying answers)
   */
  async confirmGrading(submissionId: number, gradedBy?: number) {
    const submission = await this.findSubmissionById(submissionId);

    // Calculate total score from existing answers
    const totalScore = submission.answers.reduce(
      (sum, answer) => sum + Number(answer.points_earned || 0),
      0,
    );

    return this.prisma.submission.update({
      where: { submission_id: submissionId },
      data: {
        score: totalScore,
        status: 'graded',
        graded_at: new Date(),
        ...(gradedBy && { graded_by: gradedBy }),
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
}
