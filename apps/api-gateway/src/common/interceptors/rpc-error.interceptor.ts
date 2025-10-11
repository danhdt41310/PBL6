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

@Injectable()
export class RpcErrorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RpcErrorInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
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

        // Check if it's an error object with nested IRpcError (from microservice)
        if (error && typeof error === 'object' && 'error' in error && 'message' in error) {
          const errorObj = error as any;
          
          // Check if it has the structure: { error: IRpcError, message: string }
          if (errorObj.error && typeof errorObj.error === 'object' && 
              'statusCode' in errorObj.error && 'message' in errorObj.error) {
            
            this.logger.error('Structured Error from Microservice:', errorObj);
            
            const rpcError = errorObj.error;
            const statusCode = rpcError.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
            const message = Array.isArray(rpcError.message)
              ? rpcError.message.join(', ')
              : rpcError.message || errorObj.message || 'An error occurred';

            throw new HttpException(
              {
                success: false,
                message,
                data: null,
                error: rpcError.error || 'InternalServerError',
              } as IApiResponse<null>,
              statusCode,
            );
          }
        }

        // Handle timeout or connection errors (microservice specific)
        if (error?.message?.includes('timeout') || 
            error?.code === 'ECONNREFUSED' ||
            (error?.message && (
              error.message.includes('REDIS') || 
              error.message.includes('microservice') ||
              error.message.includes('ENOTFOUND')
            ))) {
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

        // Pass through all other errors to be handled by filters
        // This includes HttpExceptions from local controllers
        this.logger.debug('Passing error to filters:', error.constructor.name);
        return throwError(() => error);
      }),
    );
  }
}
