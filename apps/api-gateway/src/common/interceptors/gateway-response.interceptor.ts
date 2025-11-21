import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { ApiResponseBuilder } from '../helpers'
import { IApiResponse } from '../interfaces'

/**
 * API Gateway Response Transform Interceptor
 * 
 * Handles responses from microservices and ensures consistent format for HTTP clients.
 * Apply this at the API GATEWAY level.
 * 
 * @example
 * Case 1: Already IApiResponse format
 * { success: true, message: '...', data: {...} } => return as is
 * 
 * Case 2: null/undefined
 * null => { success: true, message: 'Operation successful', data: null }
 * 
 * Case 3: String response
 * "Success" => { success: true, message: 'Success', data: null }
 * 
 * Case 4: Primitive types
 * 123 => { success: true, message: 'Operation successful', data: 123 }
 * true => { success: true, message: 'Operation successful', data: true }
 * 
 * Case 5: Object with only message
 * { message: 'Created' } => { success: true, message: 'Created', data: null }
 * { message: 'Done', id: 1 } => { success: true, message: 'Done', data: { id: 1 } }
 * 
 * Case 6: Object with only data
 * { data: { id: 1 } } => { success: true, message: 'Operation successful', data: { id: 1 } }
 * { data: {...}, meta: {...} } => { success: true, message: '...', data: { ..., meta: {...} } }
 * 
 * Case 7: Object with both message and data
 * { message: 'OK', data: {...} } => { success: true, message: 'OK', data: {...} }
 * { message: 'OK', data: {...}, extra: 'x' } => { success: true, message: 'OK', data: {..., extra: 'x'} }
 * 
 * Case 8: Plain object (no message/data)
 * { id: 1, name: 'John' } => { success: true, message: 'Operation successful', data: { id: 1, name: 'John' } }
 * 
 * Case 9: Array responses
 * [1, 2, 3] => { success: true, message: 'Operation successful', data: [1, 2, 3] }
 * 
 * Case 10: Empty responses
 * {} => { success: true, message: 'Operation successful', data: {} }
 * [] => { success: true, message: 'Operation successful', data: [] }
 */
@Injectable()
export class GatewayResponseInterceptor<T> implements NestInterceptor<T, IApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<IApiResponse<T>> {
    return next.handle().pipe(
      map((response) => {
        return this.transformResponse(response)
      }),
    )
  }

  /**
   * Transform any response to IApiResponse format
   */
  private transformResponse(response: unknown): IApiResponse<T> {
    // Already in correct IApiResponse format
    if (this.isApiResponse(response)) {
      return response as IApiResponse<T>
    }

    // null or undefined
    if (response === null || response === undefined) {
      return ApiResponseBuilder.success<T>(null as T, 'Operation successful')
    }

    // String response (treated as message)
    if (typeof response === 'string') {
      return ApiResponseBuilder.success<T>(null as T, response)
    }

    // Primitive types (number, boolean, bigint, symbol)
    if (this.isPrimitive(response)) {
      return ApiResponseBuilder.success<T>(response as T, 'Operation successful')
    }

    // Array (treat as data)
    if (Array.isArray(response)) {
      return ApiResponseBuilder.success<T>(response as T, 'Operation successful')
    }

    // Object responses
    if (typeof response === 'object') {
      return this.transformObjectResponse(response as Record<string, any>)
    }

    // Fallback: wrap as data
    return ApiResponseBuilder.success<T>(response as T, 'Operation successful')
  }

  /**
   * Transform object responses with various structures
   */
  private transformObjectResponse(obj: Record<string, any>): IApiResponse<T> {
    const hasMessage = 'message' in obj
    const hasData = 'data' in obj
    const keys = Object.keys(obj)

    // Empty object
    if (keys.length === 0) {
      return ApiResponseBuilder.success<T>({} as T, 'Operation successful')
    }

    // Object with both message and data
    if (hasMessage && hasData) {
      const message = this.extractMessage(obj.message)
      const { message: _, data, ...otherFields } = obj
      
      // Merge additional fields into data
      const finalData = this.mergeData(data, otherFields)
      
      return ApiResponseBuilder.success<T>(finalData as T, message)
    }

    // Object with only message
    if (hasMessage && !hasData) {
      const message = this.extractMessage(obj.message)
      const { message: _, ...restFields } = obj
      
      // If there are other fields besides message, use them as data
      const data = Object.keys(restFields).length > 0 ? restFields : null
      
      return ApiResponseBuilder.success<T>(data as T, message)
    }

    // Object with only data
    if (hasData && !hasMessage) {
      const { data, ...otherFields } = obj
      
      // If have pagination fields (meta/pagination), keep the entire structure as data
      const hasPaginationFields = Object.keys(otherFields).some(key => 
        key === 'meta' || key === 'pagination'
      )
      
      if (hasPaginationFields) {
        // Return the entire paginated structure as data: { data: [...], meta: {...} }
        return ApiResponseBuilder.success<T>(obj as T, 'Operation successful')
      }
      
      // Otherwise merge additional fields into data
      const finalData = this.mergeData(data, otherFields)
      
      return ApiResponseBuilder.success<T>(finalData as T, 'Operation successful')
    }

    // Plain object (no message or data fields)
    // Treat entire object as data
    return ApiResponseBuilder.success<T>(obj as T, 'Operation successful')
  }

  /**
   * Extract and validate message string
   */
  private extractMessage(message: unknown): string {
    if (typeof message === 'string' && message.trim().length > 0) {
      return message
    }
    
    // If message is an array (e.g., validation errors), join them
    if (Array.isArray(message)) {
      return message.filter(m => typeof m === 'string').join(', ') || 'Operation successful'
    }
    
    // If message is an object, try to stringify
    if (typeof message === 'object' && message !== null) {
      try {
        return JSON.stringify(message)
      } catch {
        return 'Operation successful'
      }
    }
    
    return 'Operation successful'
  }

  /**
   * Merge additional fields into data.
   * Handles cases where data might be null, primitive, object, or array.
   * Special handling for pagination responses.
   */
  private mergeData(data: unknown, otherFields: Record<string, any>): unknown {
    const otherKeys = Object.keys(otherFields)
    
    // No additional fields to merge
    if (otherKeys.length === 0) {
      return data
    }

    // Check if otherFields contains pagination metadata
    const hasPaginationFields = otherKeys.some(key => 
      key === 'meta' || key === 'pagination'
    )

    // Data is null/undefined - return other fields as data
    if (data === null || data === undefined) {
      return otherFields
    }

    // If we have pagination fields alongside data array, preserve the structure
    if (hasPaginationFields && Array.isArray(data)) {
      return {
        data,
        ...otherFields,
      }
    }

    // Data is primitive or array (non-pagination case) - wrap in object with data field
    if (this.isPrimitive(data) || Array.isArray(data)) {
      return {
        ...otherFields,
        data,
      }
    }

    // Data is object - merge fields
    if (typeof data === 'object') {
      return {
        ...data,
        ...otherFields,
      }
    }

    return data
  }

  /**
   * Check if value is a primitive type
   */
  private isPrimitive(value: unknown): boolean {
    const type = typeof value
    return (
      type === 'string' ||
      type === 'number' ||
      type === 'boolean' ||
      type === 'bigint' ||
      type === 'symbol'
    )
  }

  /**
   * Check if response is already in IApiResponse format
   */
  private isApiResponse(response: unknown): response is IApiResponse<T> {
    if (typeof response !== 'object' || response === null) {
      return false
    }

    const obj = response as any

    return (
      'success' in obj &&
      'message' in obj &&
      'data' in obj &&
      typeof obj.success === 'boolean' &&
      typeof obj.message === 'string'
    )
  }
}
