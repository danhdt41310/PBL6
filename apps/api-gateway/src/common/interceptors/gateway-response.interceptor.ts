import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { ApiResponseBuilder } from 'src/common/helpers'
import { IApiResponse } from 'src/common/interfaces'

/**
 * API Gateway Response Transform Interceptor
 * 
 * Handles responses from microservices and ensures consistent format for HTTP clients.
 * Apply this at the API GATEWAY level.
 *
 */
@Injectable()
export class GatewayResponseInterceptor<T> implements NestInterceptor<T, IApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<IApiResponse<T>> {
    return next.handle().pipe(
      map((gatewayResponse) => {
        // If microservice already returned IApiResponse format, pass through
        if (this.isApiResponse(gatewayResponse)) {
          return gatewayResponse as IApiResponse<T>
        }

        // Otherwise, wrap the response
        const message = this.extractMessage(gatewayResponse)
        const responseData = this.extractData(gatewayResponse)

        return ApiResponseBuilder.success<T>(responseData, message)
      }),
    )
  }

  /**
   * Check if response is already in IApiResponse format
   */
  private isApiResponse(response: unknown): response is IApiResponse {
    return (
      typeof response === 'object' &&
      response !== null &&
      'success' in response &&
      'message' in response &&
      'data' in response
    )
  }

  /**
   * Extract message from response
   */
  private extractMessage(response: unknown): string {
    if (
      response &&
      typeof response === 'object' &&
      'message' in response &&
      typeof response.message === 'string'
    ) {
      return response.message
    }
    return 'Operation successful'
  }

  /**
   * Extract data from response
   */
  private extractData(response: unknown): T {
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data as T
    }
    return response as T
  }
}