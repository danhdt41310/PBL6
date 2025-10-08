import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { IApiResponse } from 'src/common/interfaces';

/**
 * HTTP Exception Filter
 * 
 * Catches and formats HttpException errors into a consistent API response format.
 * Apply this filter to specific routes or controllers for error handling.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extract error message
    let message = 'An error occurred';
    let error: any = null;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object') {
      const responseObj = exceptionResponse as any;
      message = responseObj.message || message;
      
      // Include validation errors if present
      if (responseObj.error) {
        error = responseObj.error;
      }
      if (responseObj.errors) {
        error = responseObj.errors;
      }
    }

    // Build consistent API response
    const apiResponse: IApiResponse<null> = {
      success: false,
      message: Array.isArray(message) ? message.join(', ') : message,
      data: null,
      error: error || exception.name,
    };

    response.status(status).json(apiResponse);
  }
}
