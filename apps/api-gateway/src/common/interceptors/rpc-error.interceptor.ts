import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RpcException } from '@nestjs/microservices';
import { IApiResponse, IRpcError } from '../interfaces';

/**
 * RPC Error Interceptor for API Gateway.
 * 
 * Flow:
 * 1. Microservice throws RpcException with IRpcError
 * 2. This interceptor catches it
 * 3. Converts to HttpException with IApiResponse format
 * 4. HttpExceptionFilter handles the HttpException
 */
@Injectable()
export class RpcErrorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RpcErrorInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // Catch 'RpcException' from microservice
        if (error instanceof RpcException) {
          const errorDetails = error.getError() as IRpcError;
          
          this.logger.error('RPC Error from Microservice:', errorDetails);

          const httpStatus = errorDetails.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
          const message = Array.isArray(errorDetails.message) 
            ? errorDetails.message.join(', ') 
            : errorDetails.message;

          // Convert to 'HttpException' with 'IApiResponse' format
          throw new HttpException(
            {
              success: false,
              message,
              data: null,
              error: errorDetails.error,
            } as IApiResponse<null>,
            httpStatus,
          );
        }

        // Check if it's an HttpException-like structure from microservice
        if (error && typeof error === 'object' && 'status' in error && 'response' in error) {
          const httpError = error as any;
          
          this.logger.error('HTTP-like error from microservice:', httpError);

          const statusCode = httpError.status || HttpStatus.INTERNAL_SERVER_ERROR;
          const response = httpError.response;
          const message = Array.isArray(response?.message)
            ? response.message.join(', ')
            : response?.message || httpError.message || 'An error occurred';

          throw new HttpException(
            {
              success: false,
              message,
              data: null,
              error: response?.error || httpError.name || 'InternalServerError',
            } as IApiResponse<null>,
            statusCode,
          );
        }

        // Check if it's an RPC error with structured response (from Redis)
        if (error && typeof error === 'object' && 'error' in error) {
          const errorObj = error as any;
          
          this.logger.error('Structured RPC Error:', errorObj);

          const statusCode = errorObj.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
          const message = Array.isArray(errorObj.message)
            ? errorObj.message.join(', ')
            : errorObj.message || 'An error occurred';

          throw new HttpException(
            {
              success: false,
              message,
              data: null,
              error: errorObj.error || 'InternalServerError',
            } as IApiResponse<null>,
            statusCode,
          );
        }

        // Handle timeout or connection errors
        if (error?.message?.includes('timeout') || error?.code === 'ECONNREFUSED') {
          this.logger.error('Microservice Connection Error:', error);
          
          throw new HttpException(
            {
              success: false,
              message: 'Service temporarily unavailable',
              data: null,
              error: 'ServiceUnavailable',
            } as IApiResponse<null>,
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }

        // If error is already an HttpException, pass it through
        if (error instanceof HttpException) {
          throw error;
        }

        // Re-throw other errors to be handled by filters
        this.logger.error('Unknown error type, passing to filters:', error);
        return throwError(() => error);
      }),
    );
  }
}
