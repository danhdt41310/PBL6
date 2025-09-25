export class AddOneStudentToClassResponseDto{
  message: string;
  enrollment_id: number;
  class_id: number;
  student_id: number;
}

export class AddManyStudentsToClassResponseDto{
  message: string;
  enrollments: AddOneStudentToClassResponseDto[];
}