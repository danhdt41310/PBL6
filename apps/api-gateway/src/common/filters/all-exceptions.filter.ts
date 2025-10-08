import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { IApiResponse } from 'src/common/interfaces';

/**
 * All Exceptions Filter
 * 
 * Catches ALL exceptions including:
 * - Prisma errors
 * - Database errors
 * - Runtime errors
 * - Unhandled exceptions
 * 
 * This is a catch-all filter that provides a consistent error response
 * for any exception that isn't already handled by more specific filters.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error: any = 'UnknownError';

    // Handle HttpException separately (though HttpExceptionFilter should catch these first)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || message;
        error = responseObj.error || exception.name;
      }
    }
    // Handle Prisma errors
    else if (this.isPrismaError(exception)) {
      const prismaError = exception as any;
      status = HttpStatus.BAD_REQUEST;
      
      switch (prismaError.code) {
        case 'P2002':
          message = 'A record with this value already exists';
          error = 'UniqueConstraintViolation';
          break;
        case 'P2025':
          message = 'Record not found';
          error = 'RecordNotFound';
          status = HttpStatus.NOT_FOUND;
          break;
        case 'P2003':
          message = 'Foreign key constraint failed';
          error = 'ForeignKeyConstraintViolation';
          break;
        case 'P2014':
          message = 'Invalid relation';
          error = 'InvalidRelation';
          break;
        default:
          message = 'Database operation failed';
          error = `PrismaError_${prismaError.code}`;
      }
      
      // Log Prisma errors for debugging
      this.logger.error(`Prisma Error: ${prismaError.code}`, prismaError.meta);
    }
    // Handle standard JavaScript errors
    else if (exception instanceof Error) {
      message = exception.message || message;
      error = exception.name;
      
      // Log the full stack trace
      this.logger.error(`Unhandled Error: ${exception.message}`, exception.stack);
    }
    // Handle unknown exceptions
    else {
      this.logger.error('Unknown exception type', exception);
    }

    // Build consistent API response
    const apiResponse: IApiResponse<null> = {
      success: false,
      message,
      data: null,
      error,
    };

    response.status(status).json(apiResponse);
  }

  /**
   * Check if error is a Prisma error
   */
  private isPrismaError(exception: unknown): boolean {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      typeof (exception as any).code === 'string' &&
      (exception as any).code.startsWith('P')
    );
  }
}
