export class CreateQuestionExamDto {
  question_id: number;
  exam_id: number;
  points?: number;
}

export class UpdateQuestionExamDto {
  points?: number;
}
