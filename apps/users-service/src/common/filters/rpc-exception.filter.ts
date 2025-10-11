import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  ExceptionFilter,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

/**
 * Standard RPC Error Structure
 * Sent via Redis from microservice to api-gateway
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
 * Catches all exceptions in microservices and converts them to RpcException
 * with structured IRpcError format for proper transmission through Redis/RPC.
 * 
 * Handles:
 * - Prisma errors (P2002, P2025, etc.)
 * - NestJS HttpExceptions  
 * - RpcExceptions (already formatted)
 * - Standard JavaScript errors
 * - Unknown exceptions
 */
@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RpcExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): Observable<any> {
    this.logger.error(
      'MICROSERVICE EXCEPTION CAUGHT',
      exception instanceof Error ? exception.stack : exception
    );

    const errorResponse = this.buildErrorResponse(exception);
    
    this.logger.error(
      `Sending RpcException: [${errorResponse.statusCode}] ${errorResponse.error}`,
      errorResponse.message
    );

    // Return RpcException to send through Redis
    return throwError(() => new RpcException(errorResponse));
  }

  /**
   * Build IRpcError response from any exception type
   */
  private buildErrorResponse(exception: unknown): IRpcError {
    // 1. Already an RpcException - extract and potentially enhance
    if (exception instanceof RpcException) {
      return this.handleRpcException(exception);
    }

    // 2. Prisma Database Errors (most common in microservices)
    if (this.isPrismaError(exception)) {
      return this.handlePrismaError(exception as any);
    }

    // 3. NestJS HttpException
    if (exception instanceof HttpException) {
      return this.handleHttpException(exception);
    }

    // 4. Standard JavaScript Errors
    if (exception instanceof Error) {
      return this.handleStandardError(exception);
    }

    // 5. Unknown exceptions (objects, strings, etc.)
    return this.handleUnknownException(exception);
  }

  /**
   * Handle RpcException (already in RPC format)
   */
  private handleRpcException(exception: RpcException): IRpcError {
    const error = exception.getError();

    // Already an IRpcError object
    if (this.isIRpcError(error)) {
      return error as IRpcError;
    }

    // HttpException wrapped in RpcException
    if (error instanceof HttpException) {
      return this.handleHttpException(error);
    }

    // String or other format
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: typeof error === 'string' ? error : String(error),
      error: 'RpcException',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Handle NestJS HttpException
   */
  private handleHttpException(exception: HttpException): IRpcError {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // String response
    if (typeof exceptionResponse === 'string') {
      return {
        statusCode: status,
        message: exceptionResponse,
        error: exception.name,
        timestamp: new Date().toISOString(),
      };
    }

    // Object response (most common)
    if (typeof exceptionResponse === 'object') {
      const responseObj = exceptionResponse as any;
      return {
        statusCode: status,
        message: Array.isArray(responseObj.message)
          ? responseObj.message
          : responseObj.message || exception.message || 'An error occurred',
        error: responseObj.error || exception.name,
        timestamp: new Date().toISOString(),
      };
    }

    // Fallback
    return {
      statusCode: status,
      message: exception.message || 'An error occurred',
      error: exception.name,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Handle standard JavaScript errors
   */
  private handleStandardError(exception: Error): IRpcError {
    this.logger.error(
      `Standard Error: ${exception.name} - ${exception.message}`,
      exception.stack
    );

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: exception.message || 'Internal server error',
      error: exception.name || 'InternalError',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Handle unknown exception types
   */
  private handleUnknownException(exception: unknown): IRpcError {
    this.logger.error('Unknown exception type:', exception);

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unknown error occurred',
      error: 'UnknownError',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if error is already an IRpcError
   */
  private isIRpcError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      'message' in error &&
      'error' in error
    );
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
   * Handle Prisma-specific errors with detailed mapping
   */
  private handlePrismaError(prismaError: any): IRpcError {
    const code = prismaError.code;
    const meta = prismaError.meta;
    const clientVersion = prismaError.clientVersion;

    let statusCode = HttpStatus.BAD_REQUEST;
    let message = 'Database operation failed';
    let error = 'DatabaseError';

    switch (code) {
      case 'P2000': {
        // Value too long for column
        const column = meta?.column_name || meta?.target || 'field';
        message = `The value provided for '${column}' is too long`;
        error = 'ValueTooLong';
        statusCode = HttpStatus.BAD_REQUEST;
        break;
      }

      case 'P2001': {
        // Record not found for where condition
        const cause = meta?.cause || 'Record';
        message = `${cause} not found`;
        error = 'RecordNotFound';
        statusCode = HttpStatus.NOT_FOUND;
        break;
      }

      case 'P2002': {
        // Unique constraint violation
        const fields = Array.isArray(meta?.target) 
          ? meta.target.join(', ') 
          : meta?.target || 'field';
        message = `A record with this ${fields} already exists`;
        error = 'UniqueConstraintViolation';
        statusCode = HttpStatus.CONFLICT;
        break;
      }

      case 'P2003': {
        // Foreign key constraint failed
        const field = meta?.field_name || 'relation';
        message = `Foreign key constraint failed on '${field}'`;
        error = 'ForeignKeyConstraintViolation';
        statusCode = HttpStatus.BAD_REQUEST;
        break;
      }

      case 'P2014': {
        // Required relation violation
        const relation = meta?.relation_name || 'relation';
        message = `The change would violate the required relation '${relation}'`;
        error = 'RequiredRelationViolation';
        statusCode = HttpStatus.BAD_REQUEST;
        break;
      }

      case 'P2015': {
        // Related record not found
        message = 'A related record could not be found';
        error = 'RelatedRecordNotFound';
        statusCode = HttpStatus.NOT_FOUND;
        break;
      }

      case 'P2016': {
        // Query interpretation error
        message = 'Query interpretation error';
        error = 'QueryInterpretationError';
        statusCode = HttpStatus.BAD_REQUEST;
        break;
      }

      case 'P2025': {
        // Record not found (operations like update, delete)
        const cause = meta?.cause || 'Record to be updated';
        message = `${cause} not found`;
        error = 'RecordNotFound';
        statusCode = HttpStatus.NOT_FOUND;
        break;
      }

      default: {
        message = `Database error: ${code}`;
        error = `PrismaError_${code}`;
        statusCode = HttpStatus.BAD_REQUEST;
      }
    }

    return {
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
    };
  }
}
