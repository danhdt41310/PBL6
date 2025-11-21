export class CreateSubmissionDto {
  exam_id: number;
  student_id: number;
  answers: {
    question_id: number;
    answer_content: string;
  }[];
}

export class UpdateSubmissionDto {
  score?: number;
  teacher_feedback?: string;
  graded_by?: number;
}

export class GradeSubmissionDto {
  score: number;
  teacher_feedback?: string;
  graded_by: number;
}

export class StartExamDto {
  exam_id: number;
  student_id: number;
}

export class SubmitAnswerDto {
  question_id: number;
  answer_content: string;
}

export class UpdateRemainingTimeDto {
  remaining_time: number; // in seconds
}
