/**
 * Permissions Module - Exceptions
 * Permission-specific exceptions for permissions module operations
 */

import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '@repo/common';
import { PERMISSION_ERRORS } from '../constants';

/**
 * Permission Not Found Exception
 * Thrown when a permission cannot be found
 */
export class PermissionNotFoundException extends BusinessException {
  constructor(key: string) {
    super(PERMISSION_ERRORS.NOT_FOUND_BY_KEY(key), HttpStatus.NOT_FOUND, 'PERMISSION_NOT_FOUND');
  }
}

/**
 * Permission Already Exists Exception
 * Thrown when trying to create a permission that already exists
 */
export class PermissionAlreadyExistsException extends BusinessException {
  constructor(key: string) {
    super(PERMISSION_ERRORS.ALREADY_EXISTS(key), HttpStatus.CONFLICT, 'PERMISSION_ALREADY_EXISTS');
  }
}
