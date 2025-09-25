import { IsString, IsNotEmpty, IsInt, IsDateString, IsOptional, IsIn } from 'class-validator';

export class CreateMeetingDto {
  @IsInt()
  @IsNotEmpty()
  class_id: number;

  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsDateString()
  @IsNotEmpty()
  start_time: string;

  @IsDateString()
  @IsNotEmpty()
  end_time: string;

  @IsString()
  @IsOptional()
  @IsIn(['public', 'private'])
  type?: string = 'public';
}

export class UpdateMeetingDto {
  @IsInt()
  @IsOptional()
  class_id?: number;

  @IsString()
  @IsOptional()
  topic?: string;

  @IsDateString()
  @IsOptional()
  start_time?: string;

  @IsDateString()
  @IsOptional()
  end_time?: string;

  @IsString()
  @IsOptional()
  @IsIn(['public', 'private'])
  type?: string;
}
