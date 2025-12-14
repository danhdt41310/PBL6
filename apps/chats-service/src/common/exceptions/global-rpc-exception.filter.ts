import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Prisma } from '@prisma/chats-client';
import { throwError } from 'rxjs';
import { ERROR_MESSAGES } from '../constants';

/**
 * Prisma Error Code Enum
 */
export enum PrismaErrorCode {
  UNIQUE_CONSTRAINT = 'P2002',
  RECORD_NOT_FOUND = 'P2025',
  FOREIGN_KEY_CONSTRAINT = 'P2003',
  INVALID_RELATION = 'P2014',
  QUERY_INTERPRETATION = 'P2010',
  TABLE_NOT_EXIST = 'P2021',
  COLUMN_NOT_EXIST = 'P2022',
  INVALID_INPUT = 'P2000',
  TIMEOUT = 'P2024',
}

/**
 * Global Exception Filter for Microservices (RPC)
 *
 * Handles all types of exceptions in a unified way for microservice context:
 * - RpcException (custom business exceptions)
 * - Prisma database errors (409, 404, 400, 500)
 * - Unknown/unexpected errors (500)
 *
 * All exceptions are formatted consistently and returned as RpcException
 */
@Catch()
export class GlobalRpcExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = ERROR_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR;
    let errors: any[] = [];

    // Handle RpcException (custom business exceptions)
    if (exception instanceof RpcException) {
      const error = exception.getError();

      if (typeof error === 'object' && error !== null) {
        statusCode =
          (error as any).statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
        message = (error as any).message || message;
        errors = (error as any).errors || [];
      } else if (typeof error === 'string') {
        message = error;
      }

      console.error(
        `[RpcException] Status: ${statusCode}, Message: ${message}`,
      );

      return throwError(
        () => new RpcException({ statusCode, message, errors }),
      );
    }

    // Handle Prisma database exceptions
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const result = this.handlePrismaError(exception);
      statusCode = result.statusCode;
      message = result.message;
      errors = [{ code: exception.code, detail: exception.message }];

      console.error(
        `[PrismaError] Code: ${exception.code}, Status: ${statusCode}, Message: ${message}`,
      );

      return throwError(
        () => new RpcException({ statusCode, message, errors }),
      );
    }

    // Handle Prisma validation errors
    if (exception instanceof Prisma.PrismaClientValidationError) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Invalid data provided';
      errors = [{ detail: exception.message }];

      console.error(`[PrismaValidationError] ${exception.message}`);

      return throwError(
        () => new RpcException({ statusCode, message, errors }),
      );
    }

    // Handle Prisma initialization errors
    if (exception instanceof Prisma.PrismaClientInitializationError) {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = ERROR_MESSAGES.DATABASE.CONNECTION_FAILED;
      errors = [{ detail: exception.message }];

      console.error(`[PrismaInitializationError] ${exception.message}`);

      return throwError(
        () => new RpcException({ statusCode, message, errors }),
      );
    }

    // Handle unknown/unexpected errors
    if (exception instanceof Error) {
      message = exception.message;
      console.error(`[UnexpectedError] ${exception.message}`, exception.stack);
    } else {
      console.error(`[UnknownError]`, exception);
    }

    return throwError(() => new RpcException({ statusCode, message, errors }));
  }

  /**
   * Map Prisma error codes to HTTP status codes and messages
   */
  private handlePrismaError(exception: Prisma.PrismaClientKnownRequestError): {
    statusCode: number;
    message: string;
  } {
    const code = exception.code as PrismaErrorCode;

    switch (code) {
      case PrismaErrorCode.UNIQUE_CONSTRAINT: {
        const target = exception.meta?.target;
        let fieldName = 'unknown';
        if (Array.isArray(target)) {
          fieldName = target.join(', ');
        } else if (typeof target === 'string') {
          fieldName = target;
        }
        return {
          statusCode: HttpStatus.CONFLICT,
          message: `Unique constraint failed on field: ${fieldName}`,
        };
      }
      case PrismaErrorCode.RECORD_NOT_FOUND:
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: ERROR_MESSAGES.DATABASE.RECORD_NOT_FOUND,
        };
      case PrismaErrorCode.FOREIGN_KEY_CONSTRAINT:
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: ERROR_MESSAGES.DATABASE.FOREIGN_KEY_CONSTRAINT,
        };
      case PrismaErrorCode.INVALID_RELATION:
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid relation constraint',
        };
      case PrismaErrorCode.QUERY_INTERPRETATION:
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Query interpretation error',
        };
      case PrismaErrorCode.TABLE_NOT_EXIST:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database table does not exist',
        };
      case PrismaErrorCode.COLUMN_NOT_EXIST:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database column does not exist',
        };
      case PrismaErrorCode.INVALID_INPUT:
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid input data',
        };
      case PrismaErrorCode.TIMEOUT:
        return {
          statusCode: HttpStatus.REQUEST_TIMEOUT,
          message: ERROR_MESSAGES.GENERAL.TIMEOUT,
        };
      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database operation failed',
        };
    }
  }
}
