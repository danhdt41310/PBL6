import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Transform, Type } from "class-transformer";
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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserInfoDto)
  @IsNotEmpty()
  students: UserInfoDto[];

  @IsInt()
  @IsNotEmpty()
  class_id: number;
}

export class UpdateClassDto {
  class_name?: string;
  description?: string;
  class_code?: string;
  teacher_id?: number;
}
