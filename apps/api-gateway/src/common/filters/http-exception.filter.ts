import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common'
import { Response } from 'express'
import { IApiResponse } from '../interfaces'

/**
 * HTTP Exception Filter for API Gateway.
 * Catch HttpException and format to IApiResponse.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const status = exception.getStatus()
    const exceptionResponse = exception.getResponse()

    let apiResponse: IApiResponse<null>

    if (this.isApiResponseFormat(exceptionResponse)) {
      // If already in IApiResponse format
      apiResponse = exceptionResponse as IApiResponse<null>
    } else if (typeof exceptionResponse === 'string') {
      // If it's a simple string message
      apiResponse = {
        success: false,
        message: exceptionResponse,
        data: null,
        error: exception.name,
      }
    } else if (typeof exceptionResponse === 'object') {
      // If it's an object (validation errors, custom errors)
      const responseObj = exceptionResponse as any
      
      const message = Array.isArray(responseObj.message) 
        ? responseObj.message.join(', ') 
        : (responseObj.message || 'An error occurred')

      apiResponse = {
        success: false,
        message,
        data: null,
        error: responseObj.error || exception.name,
      }
    } else {
      // Fallback
      apiResponse = {
        success: false,
        message: 'An error occurred',
        data: null,
        error: exception.name,
      }
    }

    this.logger.error(
      `HTTP ${status} Error: ${apiResponse.message}`,
      `Path: ${request.url}`,
    )

    response.status(status).json(apiResponse)
  }

  /**
   * Check if response is already in IApiResponse format
   */
  private isApiResponseFormat(response: any): boolean {
    return (
      typeof response === 'object' &&
      response !== null &&
      'success' in response &&
      'message' in response &&
      'data' in response &&
      typeof response.success === 'boolean'
    )
  }
}
