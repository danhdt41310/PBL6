import { PostResponseDto } from "./post-response.dto";


export class ClassResponseDto{
  class_id: number;
  class_name: string;
  class_code: string;
  description?: string;
  teacher_id?: string;
  created_at: Date;
  updated_at?: Date;
}

export class ClassResponseAllInfoDto {
  class_id: number;
  class_name: string;
  class_code: string;
  description?: string;
  teacher_id?: string;
  created_at: Date;
  updated_at?: Date;
  posts:PostResponseDto[];
}

export class CreateClassResponseDto {
  message: string;
  class: ClassResponseDto;
}

export class UpdateClassResponseDto {
  message: string;
  class: ClassResponseDto;
}

