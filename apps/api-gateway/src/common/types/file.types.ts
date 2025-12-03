/**
 * Supported file types for upload
 */
export enum FileType {
  // Images
  IMAGE_JPEG = 'image/jpeg',
  IMAGE_PNG = 'image/png',
  IMAGE_GIF = 'image/gif',
  IMAGE_WEBP = 'image/webp',
  IMAGE_SVG = 'image/svg+xml',

  // Documents
  PDF = 'application/pdf',
  DOC = 'application/msword',
  DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

  // Excel files
  XLS = 'application/vnd.ms-excel',
  XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  
  // CSV
  CSV = 'text/csv',
  
  // Text
  TXT = 'text/plain',
  
  // Others
  JSON = 'application/json',
  XML = 'application/xml',
  ZIP = 'application/zip',
}

/**
 * File type groups for easier validation
 */
export const FileTypeGroups = {
  IMAGES: [
    FileType.IMAGE_JPEG,
    FileType.IMAGE_PNG,
    FileType.IMAGE_GIF,
    FileType.IMAGE_WEBP,
    FileType.IMAGE_SVG,
  ],
  DOCUMENTS: [
    FileType.PDF,
    FileType.DOC,
    FileType.DOCX,
  ],
  SPREADSHEETS: [
    FileType.XLS,
    FileType.XLSX,
    FileType.CSV,
  ],
  ALL: Object.values(FileType),
} as const

/**
 * File upload configuration
 */
export interface FileUploadConfig {
  maxSize?: number // in bytes
  allowedTypes?: readonly FileType[]
  maxFiles?: number
}

/**
 * Default file upload configurations
 */
export const DefaultFileUploadConfigs = {
  IMAGE: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: FileTypeGroups.IMAGES,
    maxFiles: 1,
  },
  DOCUMENT: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: FileTypeGroups.DOCUMENTS,
    maxFiles: 1,
  },
  EXCEL: {
    maxSize: 100 * 1024 * 1024, // 100MB for large import files
    allowedTypes: FileTypeGroups.SPREADSHEETS,
    maxFiles: 1,
  },
  MULTIPLE_IMAGES: {
    maxSize: 5 * 1024 * 1024, // 5MB per file
    allowedTypes: FileTypeGroups.IMAGES,
    maxFiles: 10,
  },
} as const

/**
 * Uploaded file metadata
 */
export interface UploadedFileMetadata {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  size: number
  buffer: Buffer
}
