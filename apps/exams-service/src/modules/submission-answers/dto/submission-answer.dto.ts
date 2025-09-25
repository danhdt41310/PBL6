export class CreateSubmissionAnswerDto {
  submission_id: number;
  question_id: number;
  answer_content: string;
}

export class UpdateSubmissionAnswerDto {
  answer_content?: string;
  is_correct?: boolean;
  points_earned?: number;
  comment?: string;
  comment_by?: number;
}
