/**
 * API Response Interface for Microservices.
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
