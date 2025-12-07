import { PrismaService } from '../../prisma/prisma.service';

/**
 * Base Repository Interface
 * Defines standard CRUD operations for all repositories
 */
export interface IBaseRepository<T> {
  create(data: Partial<T>): Promise<T>;
  findById(id: number): Promise<T | null>;
  findAll(): Promise<T[]>;
  update(id: number, data: Partial<T>): Promise<T>;
  delete(id: number): Promise<void>;
}

/**
 * Abstract Base Repository
 * Provides generic CRUD operations using Prisma
 * @template T - Entity type
 */
export abstract class BaseRepository<T> implements IBaseRepository<T> {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly modelName: string,
  ) {}

  /**
   * Get Prisma delegate for the model
   * @returns Prisma model delegate
   */
  protected get model(): any {
    return this.prisma[this.modelName];
  }

  /**
   * Create a new entity
   * @param data - Partial entity data
   * @returns Created entity
   */
  async create(data: Partial<T>): Promise<T> {
    return await this.model.create({
      data,
    });
  }

  /**
   * Find entity by ID
   * @param id - Entity ID
   * @returns Found entity or null
   */
  async findById(id: number): Promise<T | null> {
    return await this.model.findUnique({
      where: { id },
    });
  }

  /**
   * Find all entities
   * @returns Array of all entities
   */
  async findAll(): Promise<T[]> {
    return await this.model.findMany();
  }

  /**
   * Update entity by ID
   * @param id - Entity ID
   * @param data - Partial entity data to update
   * @returns Updated entity
   */
  async update(id: number, data: Partial<T>): Promise<T> {
    return await this.model.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete entity by ID
   * @param id - Entity ID
   */
  async delete(id: number): Promise<void> {
    await this.model.delete({
      where: { id },
    });
  }

  /**
   * Find entities with custom where clause
   * @param where - Prisma where clause
   * @returns Array of matching entities
   */
  protected async findMany(where: any): Promise<T[]> {
    return await this.model.findMany({ where });
  }

  /**
   * Find first entity matching criteria
   * @param where - Prisma where clause
   * @returns Found entity or null
   */
  protected async findFirst(where: any): Promise<T | null> {
    return await this.model.findFirst({ where });
  }

  /**
   * Count entities matching criteria
   * @param where - Prisma where clause
   * @returns Count of matching entities
   */
  protected async count(where?: any): Promise<number> {
    return await this.model.count({ where });
  }
}
