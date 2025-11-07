import { Injectable } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { TransactionClient, TransactionOptions } from 'src/prisma/prisma.type'

/**
 * Transaction Service.
 * 
 * Provides transaction management for Prisma operations.
 * Ensures data consistency across multiple operations.
 * 
 * @example
 * await this.transactionService.runTransaction(async (tx) => {
 *   await tx.question.create({ ... })
 *   await tx.questionCategory.create({ ... })
 * })
 */
@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Run operations within a transaction.
   * Automatically rolls back on error.
   * 
   * @param fn - Transaction callback function
   * @returns Transaction result
   */
  async runTransaction<T>(
    fn: (tx: TransactionClient) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T> {
    return await this.prisma.$transaction(fn, options)
  }
}
