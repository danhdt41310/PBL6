// ============================================================
// PAGINATION INTERFACES
// ============================================================

/**
 * Pagination Options Interface
 */
export interface IPaginationOptions {
  page?: number;
  limit?: number;
  skip?: number;
  take?: number;
}

/**
 * Paginated Result Interface
 */
export interface IPaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

/**
 * Search Filter Interface
 */
export interface ISearchFilter {
  text?: string;
  role?: string;
  status?: string;
  gender?: string;
  birthday?: string;
  [key: string]: unknown;
}

/**
 * Sort Options Interface
 */
export interface ISortOptions {
  field: string;
  order: 'asc' | 'desc';
}

// ============================================================
// BASE ENTITY INTERFACES
// ============================================================

/**
 * Base Entity Interface
 * Common fields for all database entities
 */
export interface IBaseEntity {
  id: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Audit Fields Interface
 * For entities that track who created/updated them
 */
export interface IAuditFields extends IBaseEntity {
  createdBy?: number;
  updatedBy?: number;
}

/**
 * Soft Delete Fields Interface
 */
export interface ISoftDeleteFields {
  deletedAt?: Date | string;
  deletedBy?: number;
  isDeleted?: boolean;
}

// ============================================================
// RESPONSE INTERFACES
// ============================================================

/**
 * API Response Interface
 */
export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: unknown;
  timestamp?: Date | string;
}

/**
 * RPC Response Interface
 * For microservice communication
 */
export interface IRpcResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    statusCode: number;
    message: string;
    errorCode?: string;
  };
}

// ============================================================
// FILE & AUTH INTERFACES
// ============================================================

/**
 * File Upload Interface
 */
export interface IFileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

/**
 * JWT Payload Interface
 */
export interface IJwtPayload {
  sub: number;
  email: string;
  role?: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
}

/**
 * Request User Interface
 * User object attached to authenticated requests
 */
export interface IRequestUser {
  id: number;
  email: string;
  role?: string;
  permissions?: string[];
}
