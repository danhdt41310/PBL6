import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { IRpcError } from '../interfaces/rpc-error.interface';

/**
 * Base Business Exception for RPC services.
 * Extends RpcException to include status code and error code.
 * 
 * @example throw new BusinessException('Invalid operation', 400, 'INVALID_OPERATION');
 */
export class BusinessException extends RpcException {
  public readonly statusCode: number;
  public readonly errorCode?: string;

  constructor(
    message: string,
    statusCode: number = HttpStatus.BAD_REQUEST,
    errorCode?: string,
  ) {
    const response: IRpcError = {
      statusCode,
      message,
      error: errorCode || 'BUSINESS_ERROR',
      timestamp: new Date().toISOString(),
    };

    super(response);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

/**
 * Resource Not Found Exception (404).
 * When a resource doesn't exist.
 *
 * @example throw new ResourceNotFoundException('User', 123);
 */
export class ResourceNotFoundException extends BusinessException {
  constructor(resourceName: string, identifier: number | string) {
    const message = `${resourceName} with ${typeof identifier === 'number' ? 'ID' : 'identifier'} '${identifier}' not found`;
    super(message, HttpStatus.NOT_FOUND, `${resourceName.toUpperCase().replace(/\s+/g, '_')}_NOT_FOUND`);
  }
}

/**
 * Resource Already Exists Exception (409).
 * When unique constraint is violated.
 *
 * @example throw new ResourceAlreadyExistsException('User', 'email', 'test@test.com');
 */
export class ResourceAlreadyExistsException extends BusinessException {
  constructor(resourceName: string, field: string, value: string | number) {
    const message = `${resourceName} with ${field} '${value}' already exists`;
    super(message, HttpStatus.CONFLICT, `${resourceName.toUpperCase().replace(/\s+/g, '_')}_ALREADY_EXISTS`);
  }
}

/**
 * Forbidden Action Exception (403).
 * When action is forbidden/not allowed.
 *
 * @example throw new ForbiddenActionException('delete user', 'User is protected');
 */
export class ForbiddenActionException extends BusinessException {
  constructor(action: string, reason?: string) {
    const message = reason
      ? `Forbidden to ${action}: ${reason}`
      : `Forbidden to ${action}`;
    super(message, HttpStatus.FORBIDDEN, 'FORBIDDEN_ACTION');
  }
}

/**
 * Invalid Operation Exception (400).
 * When operation is invalid in current context.
 *
 * @example throw new InvalidOperationException('Cannot send message to yourself');
 */
export class InvalidOperationException extends BusinessException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST, 'INVALID_OPERATION');
  }
}

/**
 * Unauthorized Exception (401)
 * When authentication is required
 * @example throw new UnauthorizedException('Token has expired');
 */
export class UnauthorizedException extends BusinessException {
  constructor(message: string = 'Unauthorized access') {
    super(message, HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED');
  }
}

/**
 * Invalid Input Exception (400)
 * When input validation fails
 * @example throw new InvalidInputException('email', 'Invalid email format');
 */
export class InvalidInputException extends BusinessException {
  constructor(field: string, reason: string) {
    const message = `Invalid input for '${field}': ${reason}`;
    super(message, HttpStatus.BAD_REQUEST, 'INVALID_INPUT');
  }
}

/**
 * Invalid Credentials Exception (401)
 * When login credentials are incorrect
 * @example throw new InvalidCredentialsException();
 */
export class InvalidCredentialsException extends BusinessException {
  constructor(message: string = 'Invalid email or password') {
    super(message, HttpStatus.UNAUTHORIZED, 'INVALID_CREDENTIALS');
  }
}

/**
 * Service Unavailable Exception (503)
 * When external service is temporarily unavailable
 * @example throw new ServiceUnavailableException('Email Service');
 */
export class ServiceUnavailableException extends BusinessException {
  constructor(serviceName: string) {
    const message = `${serviceName} is temporarily unavailable`;
    super(message, HttpStatus.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE');
  }
}

/**
 * Rate Limit Exceeded Exception (429)
 * When rate limit is exceeded
 * @example throw new RateLimitExceededException('API calls', 1000, 3600);
 */
export class RateLimitExceededException extends BusinessException {
  constructor(resource: string, limit: number, windowSeconds: number) {
    const message = `Rate limit exceeded for ${resource}: ${limit} requests per ${windowSeconds} seconds`;
    super(message, HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMIT_EXCEEDED');
  }
}

/**
 * Insufficient Permissions Exception (403).
 * When user lacks required permissions.
 *
 * @example throw new InsufficientPermissionsException('ADMIN', 'delete user');
 */
export class InsufficientPermissionsException extends BusinessException {
  constructor(requiredRole: string, action: string) {
    const message = `Insufficient permissions to ${action}: requires '${requiredRole}' role`;
    super(message, HttpStatus.FORBIDDEN, 'INSUFFICIENT_PERMISSIONS');
  }
}

/**
 * Invalid State Exception (400)
 * When resource is in wrong state for operation
 * @example throw new InvalidStateException('Order', 'CANCELLED', 'refund');
 */
export class InvalidStateException extends BusinessException {
  constructor(
    resourceName: string,
    currentState: string,
    attemptedAction: string,
  ) {
    const message = `Cannot ${attemptedAction} on ${resourceName} in state '${currentState}'`;
    super(message, HttpStatus.BAD_REQUEST, 'INVALID_STATE');
  }
}

/**
 * Dependency Violation Exception (409).
 * When cannot delete due to dependencies.
 *
 * @example throw new DependencyViolationException('Role', 'Users', 5);
 */
export class DependencyViolationException extends BusinessException {
  constructor(resourceName: string, dependencyName: string, count: number) {
    const message = `Cannot delete ${resourceName}: ${count} ${dependencyName} depend on it`;
    super(message, HttpStatus.CONFLICT, 'DEPENDENCY_VIOLATION');
  }
}

/**
 * External Service Exception (502).
 * When external service call fails.
 *
 * @example throw new ExternalServiceException('Payment API', 'Connection timeout');
 */
export class ExternalServiceException extends BusinessException {
  constructor(serviceName: string, error: string) {
    const message = `External service '${serviceName}' failed: ${error}`;
    super(message, HttpStatus.BAD_GATEWAY, 'EXTERNAL_SERVICE_ERROR');
  }
}

/**
 * Account Blocked Exception (403).
 * When user account is blocked.
 *
 * @example throw new AccountBlockedException('user@email.com');
 */
export class AccountBlockedException extends BusinessException {
  constructor(identifier?: string) {
    const message = identifier
      ? `Account '${identifier}' is blocked`
      : 'Account is blocked';
    super(message, HttpStatus.FORBIDDEN, 'ACCOUNT_BLOCKED');
  }
}

/**
 * Verification Failed Exception (400).
 * When verification code is invalid or expired.
 *
 * @example throw new VerificationFailedException('Code has expired');
 */
export class VerificationFailedException extends BusinessException {
  constructor(reason: string = 'Verification code is invalid or expired') {
    super(reason, HttpStatus.BAD_REQUEST, 'VERIFICATION_FAILED');
  }
}
