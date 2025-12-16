import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to capture audit context information from HTTP requests
 * This information will be used when creating audit logs
 */
@Injectable()
export class AuditContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Attach audit context to request object
    (req as any).auditContext = {
      ipAddress: this.getClientIp(req),
      userAgent: req.get('user-agent') || 'unknown',
      requestMethod: req.method,
      requestPath: req.path,
      timestamp: new Date().toISOString(),
    };

    next();
  }

  /**
   * Extract client IP address, handling proxies
   */
  private getClientIp(req: Request): string {
    const xForwardedFor = req.get('x-forwarded-for');
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim();
    }

    const xRealIp = req.get('x-real-ip');
    if (xRealIp) {
      return xRealIp;
    }

    return req.ip || req.socket.remoteAddress || 'unknown';
  }
}
