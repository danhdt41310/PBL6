import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  BadRequestException,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { FileType, FileUploadConfig } from '../types/file.types'
import { Request } from 'express'

/**
 * File Validation Interceptor
 * 
 * Validates uploaded files based on configuration
 * - File type validation
 * - File size validation
 * - File count validation
 * 
 * @example
 * @UseInterceptors(new FileValidationInterceptor({
 *   maxSize: 5 * 1024 * 1024, // 5MB
 *   allowedTypes: [FileType.XLSX, FileType.XLS],
 *   maxFiles: 1
 * }))
 */
@Injectable()
export class FileValidationInterceptor implements NestInterceptor {
  constructor(private readonly config: FileUploadConfig = {}) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>()
    const file = request.file
    const files = request.files

    // Validate single file
    if (file) {
      this.validateFile(file)
    }

    // Validate multiple files
    if (files) {
      // Coerce to array
      const fileArray = Array.isArray(files) ? files : Object.values(files).flat()
      
      // Check max files count
      if (this.config.maxFiles && fileArray.length > this.config.maxFiles) {
        throw new BadRequestException(
          `Too many files. Maximum allowed: ${this.config.maxFiles}, received: ${fileArray.length}`
        )
      }

      fileArray.forEach((f) => this.validateFile(f))
    }

    return next.handle()
  }

  /**
   * Validate individual file
   */
  private validateFile(file: any): void {
    // Validate file type
    if (this.config.allowedTypes && this.config.allowedTypes.length > 0) {
      const isValidType = this.config.allowedTypes.includes(file.mimetype as FileType)
      
      if (!isValidType) {
        throw new BadRequestException(
          `Invalid file type. Allowed types: ${this.config.allowedTypes.join(', ')}. Received: ${file.mimetype}`
        )
      }
    }

    // Validate file size
    if (this.config.maxSize && file.size > this.config.maxSize) {
      const maxSizeMB = (this.config.maxSize / (1024 * 1024)).toFixed(2)
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
      
      throw new BadRequestException(
        `File too large. Maximum size: ${maxSizeMB}MB, received: ${fileSizeMB}MB`
      )
    }

    // Validate file exists and has content
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('File is empty or corrupted')
    }
  }
}
