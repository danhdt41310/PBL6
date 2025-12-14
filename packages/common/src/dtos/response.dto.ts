import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Base Response DTO
 * Standard response wrapper for all API responses
 */
export class ResponseDto<T> {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiPropertyOptional({ description: 'Response data' })
  data?: T;

  @ApiPropertyOptional({ description: 'Error details' })
  error?: unknown;

  @ApiProperty({ description: 'Response timestamp' })
  timestamp: Date;

  constructor(success: boolean, message: string, data?: T, error?: unknown) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.error = error;
    this.timestamp = new Date();
  }

  /**
   * Create success response
   */
  static success<T>(data: T, message = 'Success'): ResponseDto<T> {
    return new ResponseDto(true, message, data);
  }

  /**
   * Create error response
   */
  static error(message: string, error?: unknown): ResponseDto<null> {
    return new ResponseDto(false, message, undefined, error);
  }
}

/**
 * Paginated Response DTO
 * Response wrapper with pagination metadata
 */
export class PaginatedResponseDto<T> extends ResponseDto<T[]> {
  @ApiProperty()
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };

  constructor(data: T[], page: number, limit: number, total: number, message = 'Success') {
    super(true, message, data);
    const totalPages = Math.ceil(total / limit);
    this.meta = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
