/**
 * Roles Module - Exceptions
 * Role-specific exceptions for roles module operations
 */

import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '@repo/common';
import { ROLE_ERRORS } from '../constants';

/**
 * Role Not Found Exception
 * Thrown when a role cannot be found by name
 */
export class RoleNotFoundException extends BusinessException {
  constructor(name?: string) {
    const message = name ? ROLE_ERRORS.NOT_FOUND_BY_NAME(name) : ROLE_ERRORS.NOT_FOUND;
    super(message, HttpStatus.NOT_FOUND, 'ROLE_NOT_FOUND');
  }
}

/**
 * Role Not Found By ID Exception
 * Thrown when a role cannot be found by ID
 */
export class RoleNotFoundByIdException extends BusinessException {
  constructor(id: number) {
    super(ROLE_ERRORS.NOT_FOUND_BY_ID(id), HttpStatus.NOT_FOUND, 'ROLE_NOT_FOUND');
  }
}

/**
 * Role Already Exists Exception
 * Thrown when trying to create a role that already exists
 */
export class RoleAlreadyExistsException extends BusinessException {
  constructor(name: string) {
    super(ROLE_ERRORS.ALREADY_EXISTS(name), HttpStatus.CONFLICT, 'ROLE_ALREADY_EXISTS');
  }
}

/**
 * Role Has Users Exception
 * Thrown when trying to delete a role that has users assigned
 */
export class RoleHasUsersException extends BusinessException {
  constructor(name: string, userCount: number) {
    super(ROLE_ERRORS.HAS_USERS(name, userCount), HttpStatus.CONFLICT, 'ROLE_HAS_USERS');
  }
}
