/**
 * Standard API Response Interface format.
 */
export interface IApiResponse<T = any> {
  /** Response status indicator */
  success: boolean

  /** Human-readable message */
  message: string

  /** Response payload - actual data or null on error */
  data: T

  /** Error information - flexible structure for any error details */
  error?: unknown
}

/**
 * Standard RPC Error Structure
 * Send via Redis from 'microservice' to 'api-gateway'
 */
export interface IRpcError {
  statusCode: number
  message: string | string[]
  error: unknown
  timestamp?: string
}
