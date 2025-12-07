import { RpcException } from '@nestjs/microservices';

/**
 * Base Business Exception (400)
 * Base class for business logic errors
 */
export class BusinessException extends RpcException {
  constructor(message: string, statusCode: number = 400) {
    super({ statusCode, message });
  }
}

/**
 * Resource Not Found Exception (404)
 * When a resource doesn't exist
 * Usage: throw new ResourceNotFoundException('Conversation', conversationId);
 */
export class ResourceNotFoundException extends RpcException {
  constructor(resourceName: string, resourceId: number | string) {
    const message = `${resourceName} with ID '${resourceId}' not found`;
    super({ statusCode: 404, message });
  }
}

/**
 * Resource Already Exists Exception (409)
 * When unique constraint is violated or resource already exists
 * Usage: throw new ResourceAlreadyExistsException('Conversation', 'users', 'sender_id and receiver_id');
 */
export class ResourceAlreadyExistsException extends RpcException {
  constructor(resourceName: string, field: string, value: string | number) {
    const message = `${resourceName} with ${field} '${value}' already exists`;
    super({ statusCode: 409, message });
  }
}

/**
 * Forbidden Action Exception (403)
 * When action is forbidden/not allowed
 * Usage: throw new ForbiddenActionException('delete conversation', 'Only participants can delete');
 */
export class ForbiddenActionException extends RpcException {
  constructor(action: string, reason?: string) {
    const message = reason
      ? `Forbidden to ${action}: ${reason}`
      : `Forbidden to ${action}`;
    super({ statusCode: 403, message });
  }
}

/**
 * Invalid Operation Exception (400)
 * When operation is invalid in current context
 * Usage: throw new InvalidOperationException('Cannot send message to yourself');
 */
export class InvalidOperationException extends RpcException {
  constructor(message: string) {
    super({ statusCode: 400, message });
  }
}

/**
 * Unauthorized Exception (401)
 * When authentication is required
 * Usage: throw new UnauthorizedException();
 */
export class UnauthorizedException extends RpcException {
  constructor(message: string = 'Unauthorized access') {
    super({ statusCode: 401, message });
  }
}

/**
 * Invalid Input Exception (400)
 * When input validation fails
 * Usage: throw new InvalidInputException('sender_id', 'Sender ID must be a positive number');
 */
export class InvalidInputException extends RpcException {
  constructor(field: string, reason: string) {
    const message = `Invalid input for '${field}': ${reason}`;
    super({ statusCode: 400, message });
  }
}

/**
 * Rate Limit Exceeded Exception (429)
 * When rate limit is exceeded
 * Usage: throw new RateLimitExceededException('API calls', 1000, 3600);
 */
export class RateLimitExceededException extends RpcException {
  constructor(resource: string, limit: number, windowSeconds: number) {
    const message = `Rate limit exceeded for ${resource}: ${limit} requests per ${windowSeconds} seconds`;
    super({ statusCode: 429, message });
  }
}

/**
 * Service Unavailable Exception (503)
 * When external service is temporarily unavailable
 * Usage: throw new ServiceUnavailableException('Payment Gateway');
 */
export class ServiceUnavailableException extends RpcException {
  constructor(serviceName: string) {
    const message = `Service '${serviceName}' is temporarily unavailable`;
    super({ statusCode: 503, message });
  }
}

/**
 * Insufficient Permissions Exception (403)
 * When user lacks required permissions
 * Usage: throw new InsufficientPermissionsException('ADMIN', 'delete user');
 */
export class InsufficientPermissionsException extends RpcException {
  constructor(requiredRole: string, action: string) {
    const message = `Insufficient permissions to ${action}: requires '${requiredRole}' role`;
    super({ statusCode: 403, message });
  }
}

/**
 * Invalid State Exception (400)
 * When resource is in wrong state for operation
 * Usage: throw new InvalidStateException('Order', 'CANCELLED', 'refund');
 */
export class InvalidStateException extends RpcException {
  constructor(
    resourceName: string,
    currentState: string,
    attemptedAction: string,
  ) {
    const message = `Cannot ${attemptedAction} on ${resourceName} in state '${currentState}'`;
    super({ statusCode: 400, message });
  }
}

/**
 * Dependency Violation Exception (409)
 * When cannot delete due to dependencies
 * Usage: throw new DependencyViolationException('Project', 'Tasks', 5);
 */
export class DependencyViolationException extends RpcException {
  constructor(resourceName: string, dependencyName: string, count: number) {
    const message = `Cannot delete ${resourceName}: ${count} ${dependencyName} depend on it`;
    super({ statusCode: 409, message });
  }
}

/**
 * Quota Exceeded Exception (403)
 * When quota/limit is exceeded
 * Usage: throw new QuotaExceededException('projects', 10, 'FREE');
 */
export class QuotaExceededException extends RpcException {
  constructor(resource: string, limit: number, plan: string) {
    const message = `Quota exceeded for ${resource}: ${limit} allowed in '${plan}' plan`;
    super({ statusCode: 403, message });
  }
}

/**
 * External Service Exception (502)
 * When external service call fails
 * Usage: throw new ExternalServiceException('Payment API', 'Connection timeout');
 */
export class ExternalServiceException extends RpcException {
  constructor(serviceName: string, error: string) {
    const message = `External service '${serviceName}' failed: ${error}`;
    super({ statusCode: 502, message });
  }
}
