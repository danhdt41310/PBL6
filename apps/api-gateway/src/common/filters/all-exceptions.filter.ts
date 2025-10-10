import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Response } from 'express'
import { IApiResponse } from 'src/common/interfaces'

/**
 * All Exceptions Filter.
 * Handles:
 * - Prisma errors (In Api-Gateway level, if any).
 * - Database errors.
 * - Runtime errors.
 * - Unhandled exceptions.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest()

    if (exception instanceof HttpException) {
      // If it's already an HttpException, let HttpExceptionFilter handle it
      throw exception
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let error = 'UnknownError'

    if (this.isPrismaError(exception)) {
      const prismaError = exception as any
      status = HttpStatus.BAD_REQUEST
      
      switch (prismaError.code) {
        case 'P2002':
          message = 'A record with this value already exists'
          error = 'UniqueConstraintViolation'
          status = HttpStatus.CONFLICT
          break
        case 'P2025':
          message = 'Record not found'
          error = 'RecordNotFound'
          status = HttpStatus.NOT_FOUND
          break
        case 'P2003':
          message = 'Foreign key constraint failed'
          error = 'ForeignKeyConstraintViolation'
          break
        case 'P2014':
          message = 'Invalid relation'
          error = 'InvalidRelation'
          break
        case 'P2000':
          message = 'The provided value is too long'
          error = 'ValueTooLong'
          break
        default:
          message = 'Database operation failed'
          error = `PrismaError_${prismaError.code}`
      }
      
      this.logger.error(`Prisma Error [${prismaError.code}]: ${message}`, prismaError.meta)
    } else if (exception instanceof Error) {
      // Handle Standard JavaScript Errors
      message = exception.message || message
      error = exception.name
      
      this.logger.error(
        `Unhandled Error: ${exception.name} - ${exception.message}`,
        exception.stack,
      )
    } else {
      // Handle unknown exceptions
      this.logger.error('Unknown exception type', exception)
    }

    const apiResponse: IApiResponse<null> = {
      success: false,
      message,
      data: null,
      error,
    }

    this.logger.error(
      `Unhandled Exception: ${message}`,
      `Path: ${request.url}`,
    )

    response.status(status).json(apiResponse)
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
    )
  }
}
