/**
 * Prisma Error Codes Enum.
 * Common Prisma error codes for database operations.
 *
 * Reference: https://www.prisma.io/docs/reference/api-reference/error-reference
 */
export enum PrismaErrorCode {
  /** P2000 - The provided value for the column is too long for the column's type */
  VALUE_TOO_LONG = 'P2000',
  
  /** P2001 - The record searched for in the where condition does not exist */
  RECORD_NOT_FOUND_WHERE = 'P2001',
  
  /** P2002 - Unique constraint failed on the constraint */
  UNIQUE_CONSTRAINT = 'P2002',
  
  /** P2003 - Foreign key constraint failed on the field */
  FOREIGN_KEY_CONSTRAINT = 'P2003',
  
  /** P2014 - The change you are trying to make would violate the required relation */
  INVALID_RELATION = 'P2014',
  
  /** P2015 - A related record could not be found */
  RELATED_RECORD_NOT_FOUND = 'P2015',
  
  /** P2016 - Query interpretation error */
  QUERY_INTERPRETATION = 'P2016',
  
  /** P2021 - The table does not exist in the current database */
  TABLE_NOT_EXIST = 'P2021',
  
  /** P2022 - The column does not exist in the current database */
  COLUMN_NOT_EXIST = 'P2022',
  
  /** P2024 - Timed out fetching a new connection from the pool */
  TIMEOUT = 'P2024',
  
  /** P2025 - An operation failed because it depends on one or more records that were required but not found */
  RECORD_NOT_FOUND = 'P2025',
  
  /** P2000 - Invalid input value */
  INVALID_INPUT = 'P2000',
}
