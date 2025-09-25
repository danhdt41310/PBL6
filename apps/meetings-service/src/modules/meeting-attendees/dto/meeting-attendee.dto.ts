import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMeetingAttendeeDto {
  @IsInt()
  @IsNotEmpty()
  meeting_id: number;

  @IsInt()
  @IsNotEmpty()
  user_id: number;

  @IsString()
  @IsOptional()
  device_id?: string;
}

export class UpdateMeetingAttendeeDto {
  @IsString()
  @IsOptional()
  device_id?: string;
}
