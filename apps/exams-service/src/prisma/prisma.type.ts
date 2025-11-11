import { PrismaClient } from '@prisma/exams-client'

/**
 * Transaction Client Type.
 * Excludes connection and transaction management methods.
 */
export type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

/**
 * Transaction Options Interface.
 */
export interface TransactionOptions {
  isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable'
  timeout?: number
  maxWait?: number
}
