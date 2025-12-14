/**
 * Users Module - Exceptions
 * User-specific exceptions for users module operations
 */

import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '@repo/common';
import { USER_ERRORS } from '../constants';

/**
 * User Not Found Exception
 * Thrown when a user cannot be found by ID or email
 */
export class UserNotFoundException extends BusinessException {
  constructor(identifier?: number | string) {
    const message = identifier 
      ? `User with ${typeof identifier === 'number' ? 'ID' : 'email'} '${identifier}' not found`
      : USER_ERRORS.NOT_FOUND;
    super(message, HttpStatus.NOT_FOUND, 'USER_NOT_FOUND');
  }
}

/**
 * User Blocked Exception
 * Thrown when a blocked user attempts to access the system
 */
export class UserBlockedException extends BusinessException {
  constructor(email?: string) {
    const message = email 
      ? `User with email '${email}' is blocked`
      : USER_ERRORS.ACCOUNT_BLOCKED;
    super(message, HttpStatus.FORBIDDEN, 'USER_BLOCKED');
  }
}

/**
 * User Already Exists Exception
 * Thrown when trying to create a user that already exists
 */
export class UserAlreadyExistsException extends BusinessException {
  constructor(email: string) {
    super(`User with email '${email}' already exists`, HttpStatus.CONFLICT, 'USER_ALREADY_EXISTS');
  }
}
