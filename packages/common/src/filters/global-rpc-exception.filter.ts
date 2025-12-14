import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BaseRpcExceptionFilter, RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import { IRpcError } from '../interfaces/rpc-error.interface';
import { PrismaErrorCode } from '../enums/prisma-error.enum';

/**
 * Global RPC Exception Filter for Microservices
 * 
 * Extends BaseRpcExceptionFilter to handle all exceptions in microservices
 * and converts them to RpcException with IRpcError format.
 * 
 * Handles:
 * - Prisma database errors (P2002, P2025, etc.)
 * - NestJS HttpExceptions
 * - RpcExceptions (already formatted)
 * - Standard JavaScript errors
 * - Unknown exceptions
 * 
 * Output Format: IRpcError interface
 */
@Catch()
export class GlobalRpcExceptionFilter extends BaseRpcExceptionFilter {
  private readonly logger = new Logger(GlobalRpcExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): Observable<never> {
    this.logger.error(
      'Microservice Exception: ',
      exception instanceof Error ? exception.stack : exception,
    );

    const errorResponse = this.buildIRpcError(exception);

    this.logger.error(
      `RPC Error [${errorResponse.statusCode}]: ${errorResponse.error}`,
      JSON.stringify(errorResponse),
    );

    return throwError(() => new RpcException(errorResponse));
  }

  /**
   * Build IRpcError from any exception type.
   */
  private buildIRpcError(exception: unknown): IRpcError {
    // RpcException (already formatted)
    if (exception instanceof RpcException) {
      return this.handleRpcException(exception);
    }

    // Prisma Database Errors
    if (this.isPrismaError(exception)) {
      return this.handlePrismaError(exception);
    }

    // HttpException
    if (exception instanceof HttpException) {
      return this.handleHttpException(exception);
    }

    // Standard JavaScript Error
    if (exception instanceof Error) {
      return this.handleStandardError(exception);
    }

    // Unknown exception
    return this.handleUnknownException(exception);
  }

  /**
   * Handle RpcException (already contains IRpcError)
   */
  private handleRpcException(exception: RpcException): IRpcError {
    const error = exception.getError();

    // Already properly formatted IRpcError
    if (this.isIRpcError(error)) {
      const rpcError = error as IRpcError;
      return {
        ...rpcError,
        timestamp: rpcError.timestamp || new Date().toISOString(),
      };
    }

    // String message
    if (typeof error === 'string') {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
        error: 'RpcException',
        timestamp: new Date().toISOString(),
      };
    }

    // Object but not IRpcError format
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, unknown>;
      return {
        statusCode: (errorObj.statusCode as number) || HttpStatus.INTERNAL_SERVER_ERROR,
        message: (errorObj.message as string) || 'RPC Error',
        error: (errorObj.error as string) || 'RpcException',
        timestamp: new Date().toISOString(),
        errorCode: errorObj.errorCode as string | undefined,
      };
    }

    // Fallback
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: String(error),
      error: 'RpcException',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Handle HttpException
   */
  private handleHttpException(exception: HttpException): IRpcError {
    const status = exception.getStatus();
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return {
        statusCode: status,
        message: response,
        error: exception.name,
        timestamp: new Date().toISOString(),
      };
    }

    if (typeof response === 'object' && response !== null) {
      const responseObj = response as Record<string, unknown>;
      return {
        statusCode: status,
        message: Array.isArray(responseObj.message)
          ? responseObj.message
          : String(responseObj.message || exception.message),
        error: String(responseObj.error || exception.name),
        timestamp: new Date().toISOString(),
        errorCode: responseObj.errorCode as string | undefined,
      };
    }

    return {
      statusCode: status,
      message: exception.message,
      error: exception.name,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Handle standard JavaScript Error
   */
  private handleStandardError(exception: Error): IRpcError {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: exception.message || 'Internal server error',
      error: exception.name || 'Error',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Handle unknown exception
   */
  private handleUnknownException(exception: unknown): IRpcError {
    this.logger.warn('Unknown exception type:', exception);

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unknown error occurred',
      error: 'UnknownError',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if error object is IRpcError.
   */
  private isIRpcError(error: unknown): error is IRpcError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      'message' in error &&
      'error' in error
    );
  }

  /**
   * Check if exception is Prisma error.
   */
  private isPrismaError(exception: unknown): boolean {
    if (typeof exception !== 'object' || exception === null) {
      return false;
    }

    const error = exception as { code?: unknown; constructor?: { name?: string } };
    
    // Check for Prisma error code (P2xxx format)
    const hasErrorCode = 'code' in error && 
      typeof error.code === 'string' && 
      error.code.startsWith('P');
    
    // Check for Prisma in constructor name
    const hasPrismaConstructor = error.constructor?.name?.includes('Prisma') === true;

    return hasErrorCode || hasPrismaConstructor;
  }

  /**
   * Handle Prisma database errors
   */
  private handlePrismaError(prismaError: unknown): IRpcError {
    const error = prismaError as {
      code?: string;
      meta?: {
        target?: string | string[];
        field_name?: string;
        cause?: string;
        column_name?: string;
      };
      message?: string;
    };

    const code = error.code || '';
    const meta = error.meta || {};

    switch (code) {
      case PrismaErrorCode.UNIQUE_CONSTRAINT: {
        const fields = Array.isArray(meta.target)
          ? meta.target.join(', ')
          : meta.target || 'field';
        return {
          statusCode: HttpStatus.CONFLICT,
          message: `A record with this ${fields} already exists`,
          error: 'UniqueConstraintViolation',
          errorCode: code,
          timestamp: new Date().toISOString(),
        };
      }

      case PrismaErrorCode.RECORD_NOT_FOUND:
      case PrismaErrorCode.RECORD_NOT_FOUND_WHERE: {
        const cause = meta.cause || 'Record';
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: `${cause} not found`,
          error: 'RecordNotFound',
          errorCode: code,
          timestamp: new Date().toISOString(),
        };
      }

      case PrismaErrorCode.FOREIGN_KEY_CONSTRAINT: {
        const field = meta.field_name || 'relation';
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Foreign key constraint failed on '${field}'`,
          error: 'ForeignKeyConstraintViolation',
          errorCode: code,
          timestamp: new Date().toISOString(),
        };
      }

      case PrismaErrorCode.INVALID_RELATION: {
        const relation = meta.field_name || 'relation';
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `The change would violate the required relation '${relation}'`,
          error: 'RequiredRelationViolation',
          errorCode: code,
          timestamp: new Date().toISOString(),
        };
      }

      case PrismaErrorCode.TIMEOUT: {
        return {
          statusCode: HttpStatus.REQUEST_TIMEOUT,
          message: 'Database operation timed out',
          error: 'DatabaseTimeout',
          errorCode: code,
          timestamp: new Date().toISOString(),
        };
      }

      default: {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: error.message || `Database error: ${code}`,
          error: 'DatabaseError',
          errorCode: code,
          timestamp: new Date().toISOString(),
        };
      }
    }
  }
}
