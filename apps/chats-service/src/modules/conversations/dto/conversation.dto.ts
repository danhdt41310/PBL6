import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @IsNotEmpty()
  sender_id: string;

  @IsString()
  @IsNotEmpty()
  receiver_id: string;
}

export class UpdateConversationDto {
  @IsString()
  @IsOptional()
  sender_id?: string;

  @IsString()
  @IsOptional()
  receiver_id?: string;
}
