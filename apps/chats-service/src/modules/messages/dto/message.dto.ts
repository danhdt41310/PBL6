import { IsString, IsNotEmpty, IsInt, IsOptional, IsIn } from 'class-validator';

export class CreateMessageDto {
  @IsInt()
  @IsNotEmpty()
  sender_id: number;

  @IsInt()
  @IsNotEmpty()
  conversation_id: number;

  @IsString()
  @IsOptional()
  @IsIn(['text', 'file', 'image'])
  message_type?: string = 'text';

  @IsString()
  @IsOptional()
  content?: string;
}

export class UpdateMessageDto {
  @IsString()
  @IsOptional()
  @IsIn(['text', 'file', 'image'])
  message_type?: string;

  @IsString()
  @IsOptional()
  content?: string;
}
