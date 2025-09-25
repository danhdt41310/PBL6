export class CreateQuestionDto {
  content: string;
  type: string; // 'MCQ', 'essay', 'true/false'
  options?: any; // JSON array for MCQ options
  correct_answer?: string;
}

export class UpdateQuestionDto {
  content?: string;
  type?: string;
  options?: any;
  correct_answer?: string;
}
