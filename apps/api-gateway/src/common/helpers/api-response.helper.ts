import { IApiResponse } from '../interfaces'

export class ApiResponseBuilder {
  static success<T>(data: T, message = 'Request successful'): IApiResponse<T> {
    return {
      success: true,
      message,
      data,
    }
  }

  static error<T = null>(message: string, error?: unknown, data: T = null as T): IApiResponse<T> {
    return {
      success: false,
      message,
      data,
      error,
    }
  }
}