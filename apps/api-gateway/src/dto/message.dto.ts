import { IsString, IsNotEmpty, IsInt, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum MessageType {
    text = 'text',
    file = 'file',
    image = 'image',
}

/**
 * DTO for creating a new message
 */
export class CreateMessageDto {
    @ApiProperty({
        description: 'ID of the user sending the message',
        example: 1,
        type: Number,
    })
    @IsInt()
    @IsNotEmpty()
    @Type(() => Number)
    sender_id: number;

    @ApiProperty({
        description: 'ID of the conversation this message belongs to',
        example: 1,
        type: Number,
    })
    @IsInt()
    @IsNotEmpty()
    @Type(() => Number)
    conversation_id: number;

    @ApiPropertyOptional({
        description: 'Type of the message',
        enum: MessageType,
        default: MessageType.text,
        example: MessageType.text,
    })
    @IsEnum(MessageType)
    @IsOptional()
    message_type?: MessageType = MessageType.text;

    @ApiPropertyOptional({
        description: 'Content of the message',
        example: 'Hello, how are you?',
        type: String,
    })
    @IsString()
    @IsOptional()
    content?: string;
}

/**
 * DTO for updating a message
 */
export class UpdateMessageDto extends PartialType(CreateMessageDto) {
    @ApiPropertyOptional({
        description: 'Type of the message',
        enum: MessageType,
        example: MessageType.text,
    })
    @IsEnum(MessageType)
    @IsOptional()
    message_type?: MessageType;

    @ApiPropertyOptional({
        description: 'Updated content of the message',
        example: 'Hello, how are you doing?',
        type: String,
    })
    @IsString()
    @IsOptional()
    content?: string;
}

/**
 * DTO for pagination query
 */
export class PaginationQueryDto {
    @ApiPropertyOptional({
        description: 'Page number',
        example: 1,
        default: 1,
        minimum: 1,
    })
    @IsInt()
    @IsOptional()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Number of items per page',
        example: 20,
        default: 20,
        minimum: 1,
        maximum: 100,
    })
    @IsInt()
    @IsOptional()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    limit?: number = 20;
}
