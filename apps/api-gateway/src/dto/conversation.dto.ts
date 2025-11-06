import { IsInt, IsNotEmpty, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for creating a new conversation
 */
export class CreateConversationDto {
    @ApiProperty({
        description: 'ID of the user initiating the conversation',
        example: 1,
        type: Number,
    })
    @IsInt()
    @IsNotEmpty()
    @Type(() => Number)
    sender_id: number;

    @ApiProperty({
        description: 'ID of the user receiving the conversation',
        example: 2,
        type: Number,
    })
    @IsInt()
    @IsNotEmpty()
    @Type(() => Number)
    receiver_id: number;
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
