import {
  IBaseRepository,
  IPrismaService,
  PaginatedResult,
  FindAllOptions,
  BatchPayload,
  TransactionClient,
  QueryOptions,
  UpsertOptions,
} from '../interfaces/repository.interface';

/**
 * Abstract Base Repository.
 * Provides comprehensive generic CRUD operations using Prisma.
 * Each service should extend this with their own PrismaService.
 *
 * @template T - Entity type
 * @template CreateInput - Create input type (defaults to Partial<T>)
 * @template UpdateInput - Update input type (defaults to Partial<T>)
 * @template WhereInput - Where clause input type
 * @template OrderByInput - OrderBy clause input type
 *
 * @example
 * class UserRepository extends BaseRepository<User, Prisma.UserCreateInput, Prisma.UserUpdateInput> {
 *   constructor(prisma: PrismaService) {
 *     super(prisma, 'user');
 *   }
 * }
 */
export abstract class BaseRepository<
  T,
  CreateInput = Partial<T>,
  UpdateInput = Partial<T>,
  WhereInput = Record<string, unknown>,
  OrderByInput = Record<string, 'asc' | 'desc'>,
> implements IBaseRepository<T, CreateInput, UpdateInput, WhereInput>
{
  protected readonly idField: string;

  constructor(
    protected readonly prisma: IPrismaService,
    protected readonly modelName: string,
    idField: string = 'id',
  ) {
    this.idField = idField;
  }

  // ============================================================
  // MODEL ACCESSOR
  // ============================================================
  
  /**
   * Get Prisma delegate for the model.
   * @returns Prisma model delegate
   */
  protected get model(): any {
    return this.prisma[this.modelName];
  }

  /**
   * Get the Prisma client.
   * @returns Prisma client
   */
  getClient(): IPrismaService {
    return this.prisma;
  }

  /**
   * Get the model name.
   * @returns Model name string
   */
  getModelName(): string {
    return this.modelName;
  }

  /**
   * Get the ID field name.
   * @returns ID field name string
   */
  getIdField(): string {
    return this.idField;
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================
  
  /**
   * Build ID where clause.
   * @param id - Entity ID
   * @returns Where clause with correct ID field
   */
  protected buildIdWhere(id: number): Record<string, number> {
    return { [this.idField]: id };
  }

  // ============================================================
  // CREATE OPERATIONS
  // ============================================================
  
  /**
   * Create a new entity.
   * @param data - Entity creation data
   * @returns Created entity
   */
  async create(data: CreateInput): Promise<T> {
    return await this.model.create({
      data,
    });
  }

  /**
   * Create a new entity with include/select options.
   * @param data - Entity creation data
   * @param options - Include/select options
   * @returns Created entity with relations
   */
  async createWithOptions(
    data: CreateInput,
    options?: { include?: Record<string, unknown>; select?: Record<string, unknown> },
  ): Promise<T> {
    return await this.model.create({
      data,
      ...options,
    });
  }

  /**
   * Create multiple entities
   * @param data - Array of entity creation data
   * @returns Batch payload with count
   */
  async createMany(data: CreateInput[]): Promise<BatchPayload> {
    return await this.model.createMany({
      data,
      skipDuplicates: true,
    });
  }

  /**
   * Create multiple entities and return them
   * Note: Uses individual creates as fallback for databases without createManyAndReturn
   * @param data - Array of entity creation data
   * @returns Array of created entities
   */
  async createManyAndReturn(data: CreateInput[]): Promise<T[]> {
    const results: T[] = [];
    for (const item of data) {
      const created = await this.create(item);
      results.push(created);
    }
    return results;
  }

  // ============================================================
  // READ OPERATIONS
  // ============================================================
  
  /**
   * Find entity by ID.
   * @param id - Entity ID
   * @returns Found entity or null
   */
  async findById(id: number): Promise<T | null> {
    return await this.model.findUnique({
      where: this.buildIdWhere(id),
    });
  }

  /**
   * Find entity by ID with include/select options
   * @param id - Entity ID
   * @param options - Include/select options
   * @returns Found entity with relations or null
   */
  async findByIdWithOptions(
    id: number,
    options?: { include?: Record<string, unknown>; select?: Record<string, unknown> },
  ): Promise<T | null> {
    return await this.model.findUnique({
      where: this.buildIdWhere(id),
      ...options,
    });
  }

  /**
   * Find all entities with optional filtering and pagination
   * @param where - Filter conditions
   * @param skip - Number of records to skip
   * @param take - Number of records to take
   * @returns Array of entities
   */
  async findAll(where?: WhereInput, skip?: number, take?: number): Promise<T[]> {
    return await this.model.findMany({
      where,
      skip,
      take,
    });
  }

  /**
   * Find all with full query options
   * @param options - Query options
   * @returns Array of entities
   */
  async findMany(options?: QueryOptions<WhereInput, OrderByInput>): Promise<T[]> {
    return await this.model.findMany(options);
  }

  /**
   * Find all with pagination
   * @param options - Pagination options
   * @returns Paginated result
   */
  async findAllPaginated(options: FindAllOptions<WhereInput, OrderByInput> = {}): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 10, where, orderBy, include, select } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include,
        select,
      }),
      this.model.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Find first entity matching criteria
   * @param where - Prisma where clause
   * @returns Found entity or null
   */
  async findFirst(where: WhereInput): Promise<T | null> {
    return await this.model.findFirst({ where });
  }

  /**
   * Find first entity with options
   * @param options - Query options
   * @returns Found entity or null
   */
  async findFirstWithOptions(options: QueryOptions<WhereInput, OrderByInput>): Promise<T | null> {
    return await this.model.findFirst(options);
  }

  /**
   * Find unique entity by criteria
   * @param where - Prisma where clause
   * @returns Found entity or null
   */
  async findUnique(where: Record<string, unknown>): Promise<T | null> {
    return await this.model.findUnique({ where });
  }

  /**
   * Find unique entity with options
   * @param where - Prisma where clause
   * @param options - Include/select options
   * @returns Found entity or null
   */
  async findUniqueWithOptions(
    where: Record<string, unknown>,
    options?: { include?: Record<string, unknown>; select?: Record<string, unknown> },
  ): Promise<T | null> {
    return await this.model.findUnique({
      where,
      ...options,
    });
  }

  // ============================================================
  // UPDATE OPERATIONS
  // ============================================================
  
  /**
   * Update entity by ID.
   * @param id - Entity ID
   * @param data - Entity update data
   * @returns Updated entity
   */
  async update(id: number, data: UpdateInput): Promise<T> {
    return await this.model.update({
      where: this.buildIdWhere(id),
      data,
    });
  }

  /**
   * Update entity by ID with options
   * @param id - Entity ID
   * @param data - Entity update data
   * @param options - Include/select options
   * @returns Updated entity with relations
   */
  async updateWithOptions(
    id: number,
    data: UpdateInput,
    options?: { include?: Record<string, unknown>; select?: Record<string, unknown> },
  ): Promise<T> {
    return await this.model.update({
      where: this.buildIdWhere(id),
      data,
      ...options,
    });
  }

  /**
   * Update entity by where clause
   * @param where - Where clause
   * @param data - Update data
   * @returns Updated entity
   */
  async updateWhere(where: Record<string, unknown>, data: UpdateInput): Promise<T> {
    return await this.model.update({
      where,
      data,
    });
  }

  /**
   * Update many entities
   * @param where - Where clause
   * @param data - Update data
   * @returns Batch payload with count
   */
  async updateMany(where: WhereInput, data: UpdateInput): Promise<BatchPayload> {
    return await this.model.updateMany({ where, data });
  }

  /**
   * Upsert entity (create if not exists, update if exists)
   * @param options - Upsert options with where, create, update
   * @returns Created or updated entity
   */
  async upsert(options: UpsertOptions<CreateInput, UpdateInput>): Promise<T> {
    return await this.model.upsert(options);
  }

  // ============================================================
  // DELETE OPERATIONS
  // ============================================================
  
  /**
   * Delete entity by ID.
   * @param id - Entity ID
   * @returns Deleted entity
   */
  async delete(id: number): Promise<T> {
    return await this.model.delete({
      where: this.buildIdWhere(id),
    });
  }

  /**
   * Delete entity by where clause
   * @param where - Where clause
   * @returns Deleted entity
   */
  async deleteWhere(where: Record<string, unknown>): Promise<T> {
    return await this.model.delete({
      where,
    });
  }

  /**
   * Delete many entities
   * @param where - Where clause
   * @returns Batch payload with count
   */
  async deleteMany(where: WhereInput): Promise<BatchPayload> {
    return await this.model.deleteMany({ where });
  }

  /**
   * Soft delete entity by ID (requires deletedAt field)
   * @param id - Entity ID
   * @returns Updated entity with deletedAt set
   */
  async softDelete(id: number): Promise<T> {
    return await this.model.update({
      where: this.buildIdWhere(id),
      data: { deletedAt: new Date() } as UpdateInput,
    });
  }

  /**
   * Soft delete many entities
   * @param where - Where clause
   * @returns Batch payload with count
   */
  async softDeleteMany(where: WhereInput): Promise<BatchPayload> {
    return await this.model.updateMany({
      where,
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Restore soft deleted entity
   * @param id - Entity ID
   * @returns Restored entity
   */
  async restore(id: number): Promise<T> {
    return await this.model.update({
      where: this.buildIdWhere(id),
      data: { deletedAt: null } as UpdateInput,
    });
  }

  // ============================================================
  // AGGREGATE OPERATIONS
  // ============================================================
  
  /**
   * Count entities with optional filter.
   * @param where - Filter conditions
   * @returns Count of entities
   */
  async count(where?: WhereInput): Promise<number> {
    return await this.model.count({ where });
  }

  /**
   * Check if entity exists by ID
   * @param id - Entity ID
   * @returns Boolean indicating existence
   */
  async exists(id: number): Promise<boolean> {
    const count = await this.model.count({
      where: this.buildIdWhere(id),
    });
    return count > 0;
  }

  /**
   * Check if entity exists by where clause
   * @param where - Where clause
   * @returns Boolean indicating existence
   */
  async existsWhere(where: WhereInput): Promise<boolean> {
    const count = await this.model.count({ where });
    return count > 0;
  }

  /**
   * Aggregate operation (sum, avg, min, max, count)
   * @param options - Aggregate options
   * @returns Aggregate result
   */
  async aggregate(options: {
    where?: WhereInput;
    _count?: boolean | Record<string, boolean>;
    _avg?: Record<string, boolean>;
    _sum?: Record<string, boolean>;
    _min?: Record<string, boolean>;
    _max?: Record<string, boolean>;
  }): Promise<unknown> {
    return await this.model.aggregate(options);
  }

  /**
   * Group by operation
   * @param options - Group by options
   * @returns Array of grouped results
   */
  async groupBy(options: {
    by: string[];
    where?: WhereInput;
    _count?: boolean | Record<string, boolean>;
    _avg?: Record<string, boolean>;
    _sum?: Record<string, boolean>;
    _min?: Record<string, boolean>;
    _max?: Record<string, boolean>;
    having?: Record<string, unknown>;
    orderBy?: OrderByInput;
    skip?: number;
    take?: number;
  }): Promise<unknown[]> {
    return await this.model.groupBy(options);
  }

  // ============================================================
  // TRANSACTION OPERATIONS
  // ============================================================
  
  /**
   * Execute a callback within a transaction (public access).
   * @param fn - Transaction callback
   * @returns Transaction result
   */
  async runTransaction<R>(fn: (tx: TransactionClient) => Promise<R>): Promise<R> {
    return await this.prisma.$transaction(fn);
  }

  /**
   * Execute transaction with options
   * @param fn - Transaction callback
   * @param options - Transaction options (maxWait, timeout, isolationLevel)
   * @returns Transaction result
   */
  async runTransactionWithOptions<R>(
    fn: (tx: TransactionClient) => Promise<R>,
    options?: { maxWait?: number; timeout?: number; isolationLevel?: string },
  ): Promise<R> {
    return await (this.prisma as any).$transaction(fn, options);
  }

  // ============================================================
  // RAW QUERY OPERATIONS
  // ============================================================
  
  /**
   * Execute raw SQL query (SELECT).
   * @param query - SQL query string
   * @param values - Query parameters
   * @returns Query result
   */
  async queryRaw<R = unknown>(query: string, ...values: unknown[]): Promise<R> {
    return await (this.prisma as any).$queryRawUnsafe(query, ...values);
  }

  /**
   * Execute raw SQL command (INSERT, UPDATE, DELETE)
   * @param query - SQL command string
   * @param values - Command parameters
   * @returns Number of affected rows
   */
  async executeRaw(query: string, ...values: unknown[]): Promise<number> {
    return await (this.prisma as any).$executeRawUnsafe(query, ...values);
  }
}
