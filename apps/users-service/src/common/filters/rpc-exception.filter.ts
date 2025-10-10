import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  RpcExceptionFilter as IRpcExceptionFilter,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

/**
 * Standard RPC Error Structure
 * Send via Redis from 'microservice' to 'api-gateway'
 */
export interface IRpcError {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp?: string;
}

/**
 * RPC Exception Filter for Microservices
 * 
 * Catches all exceptions in microservices and converts them to a structured format
 * that can be properly sent back through Redis/RPC to the API Gateway.
 * 
 * Handles:
 * - Prisma errors (P2002, P2025, etc.)
 * - NestJS HttpExceptions
 * - RpcExceptions
 * - Generic JavaScript errors
 */
@Catch()
export class RpcExceptionFilter implements IRpcExceptionFilter<any>{
  private readonly logger = new Logger(RpcExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): Observable<any> {
    this.logger.error('Microservice Exception:', exception);

    let errorResponse: IRpcError;

    // Is RpcException => extract IRpcError directly
    if (exception instanceof RpcException) {
      const error = exception.getError();
      
      // Check if the error is an HttpException wrapped in RpcException
      if (error instanceof HttpException) {
        const status = error.getStatus();
        const exceptionResponse = error.getResponse();
        
        if (typeof exceptionResponse === 'string') {
          errorResponse = {
            statusCode: status,
            message: exceptionResponse,
            error: error.name,
            timestamp: new Date().toISOString(),
          };
        } else if (typeof exceptionResponse === 'object') {
          const responseObj = exceptionResponse as any;
          errorResponse = {
            statusCode: status,
            message: Array.isArray(responseObj.message)
              ? responseObj.message
              : responseObj.message || error.message,
            error: responseObj.error || error.name,
            timestamp: new Date().toISOString(),
          };
        } else {
          errorResponse = {
            statusCode: status,
            message: error.message,
            error: error.name,
            timestamp: new Date().toISOString(),
          };
        }
      }
      // Check if error is already an IRpcError object
      else if (typeof error === 'object' && error !== null && 'statusCode' in error) {
        errorResponse = error as IRpcError;
      } else {
        errorResponse = {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: String(error),
          error: 'RpcException',
          timestamp: new Date().toISOString(),
        };
      }
    }
    // 2. Prisma Database Errors
    else if (this.isPrismaError(exception)) {
      errorResponse = this.handlePrismaError(exception);
    }
    // 3. NestJS HttpException
    else if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        errorResponse = {
          statusCode: status,
          message: exceptionResponse,
          error: exception.name,
          timestamp: new Date().toISOString(),
        };
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        errorResponse = {
          statusCode: status,
          message: Array.isArray(responseObj.message)
            ? responseObj.message
            : responseObj.message || 'An error occurred',
          error: responseObj.error || exception.name,
          timestamp: new Date().toISOString(),
        };
      } else {
        errorResponse = {
          statusCode: status,
          message: 'An error occurred',
          error: exception.name,
          timestamp: new Date().toISOString(),
        };
      }

      this.logger.error(`HTTP Exception [${status}]: ${errorResponse.message}`);
    }
    // 4. Standard JavaScript Errors
    else if (exception instanceof Error) {
      errorResponse = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message || 'Internal server error',
        error: exception.name || 'InternalError',
        timestamp: new Date().toISOString(),
      };
      
      this.logger.error(`Unhandled Error: ${exception.message}`, exception.stack);
    }
    // 5. Unknown exceptions
    else {
      errorResponse = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An unknown error occurred',
        error: 'UnknownError',
        timestamp: new Date().toISOString(),
      };
      
      this.logger.error('Unknown exception type', exception);
    }

    // Return RpcException để gửi qua Redis
    return throwError(() => new RpcException(errorResponse));
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

  /**
   * Handle Prisma-specific errors
   */
  private handlePrismaError(prismaError: any): IRpcError {
    let statusCode = HttpStatus.BAD_REQUEST;
    let message = 'Database operation failed';
    let error = 'DatabaseError';

    switch (prismaError.code) {
      case 'P2002': {
        // Unique constraint violation
        const field = prismaError.meta?.target?.[0] || 'field';
        message = `A record with this ${field} already exists`;
        error = 'UniqueConstraintViolation';
        statusCode = 409; // Conflict
        break;
      }
      case 'P2025': {
        // Record not found
        message = 'Record not found';
        error = 'RecordNotFound';
        statusCode = 404; // Not Found
        break;
      }
      case 'P2003': {
        // Foreign key constraint failed
        message = 'Foreign key constraint failed';
        error = 'ForeignKeyConstraintViolation';
        statusCode = 400; // Bad Request
        break;
      }
      case 'P2014': {
        // Invalid relation
        message = 'Invalid relation';
        error = 'InvalidRelation';
        statusCode = 400;
        break;
      }
      case 'P2000': {
        // Value too long
        message = 'The provided value is too long';
        error = 'ValueTooLong';
        statusCode = 400;
        break;
      }
      default: {
        message = `Database error: ${prismaError.code}`;
        error = `PrismaError_${prismaError.code}`;
        statusCode = 400;
      }
    }

    this.logger.error(
      `Prisma Error [${prismaError.code}]: ${message}`,
      JSON.stringify(prismaError.meta),
    );

    return {
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
    };
  }
}
