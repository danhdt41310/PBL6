import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { Transform } from "class-transformer";
import { UserInfoDto } from "./user.dto";

export class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  class_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  class_code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsNotEmpty()
  teacher_id: number;
}

export class AddStudentsDto {
    
    students: UserInfoDto[];

    @IsInt()
    class_id: number;

}