/**
 * Base Repository Interface
 * Defines standard CRUD operations for all repositories
 * @template T - Entity type
 * @template CreateInput - Create input type
 * @template UpdateInput - Update input type
 * @template WhereInput - Where clause input type
 */
export interface IBaseRepository<
  T,
  CreateInput = Partial<T>,
  UpdateInput = Partial<T>,
  WhereInput = Record<string, unknown>,
> {
  create(data: CreateInput): Promise<T>;
  findById(id: number): Promise<T | null>;
  findAll(where?: WhereInput, skip?: number, take?: number): Promise<T[]>;
  update(id: number, data: UpdateInput): Promise<T>;
  delete(id: number): Promise<T | void>;
  count(where?: WhereInput): Promise<number>;
}

/**
 * Paginated Result Interface
 * Standard pagination response structure
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

/**
 * Find All Options Interface
 * Options for paginated queries
 */
export interface FindAllOptions<WhereInput = Record<string, unknown>, OrderByInput = Record<string, 'asc' | 'desc'>> {
  page?: number;
  limit?: number;
  skip?: number;
  take?: number;
  orderBy?: OrderByInput;
  where?: WhereInput;
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
}

/**
 * Prisma Service Interface
 * Abstract interface for PrismaService to avoid direct dependency
 */
export interface IPrismaService {
  [key: string]: unknown;
  $transaction: <T>(fn: (tx: unknown) => Promise<T>) => Promise<T>;
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
}

/**
 * Batch Payload Result
 * Result of batch operations like deleteMany, updateMany
 */
export interface BatchPayload {
  count: number;
}

/**
 * Transaction Client Interface
 * Represents Prisma transaction client
 */
export type TransactionClient = unknown;

/**
 * Query Options Interface
 * Generic query options for find operations
 */
export interface QueryOptions<WhereInput = Record<string, unknown>, OrderByInput = Record<string, 'asc' | 'desc'>> {
  where?: WhereInput;
  orderBy?: OrderByInput;
  skip?: number;
  take?: number;
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
  cursor?: Record<string, unknown>;
  distinct?: string[];
}

/**
 * Upsert Options Interface
 */
export interface UpsertOptions<CreateInput, UpdateInput, WhereInput = Record<string, unknown>> {
  where: WhereInput;
  create: CreateInput;
  update: UpdateInput;
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
}

/**
 * Include Options Interface
 * Options for including relations
 */
export type IncludeOptions = Record<string, boolean | Record<string, unknown>>;

/**
 * Select Options Interface
 * Options for selecting fields
 */
export type SelectOptions = Record<string, boolean | Record<string, unknown>>;
