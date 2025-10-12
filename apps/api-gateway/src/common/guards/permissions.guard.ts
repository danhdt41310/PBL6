import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../services/prisma.service';

export const SKIP_PERMISSION_CHECK = 'skipPermissionCheck';

interface AuthenticatedRequest {
  user?: {
    userId: number;
    email: string;
    [key: string]: any;
  };
  method: string;
  url: string;
  route?: {
    path: string;
  };
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if permission check should be skipped
    const skipPermissionCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_PERMISSION_CHECK,
      [context.getHandler(), context.getClass()],
    );

    if (skipPermissionCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || !user.userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Generate permission key from current request
    const permissionKey = this.generatePermissionKey(request);
    
    if (!permissionKey) {
      // If we can't generate a permission key, allow access
      return true;
    }

    // Check if user has the required permission
    const hasPermission = await this.checkUserPermission(user.userId, permissionKey);
    
    if (!hasPermission) {
      throw new UnauthorizedException(`Insufficient permissions. Required: ${permissionKey}`);
    }

    return true;
  }

  private generatePermissionKey(request: AuthenticatedRequest): string | null {
    const method = request.method.toUpperCase();
    const path = request.route?.path || request.url;
    
    if (!path) return null;

    // Clean the path and split into segments - same logic as sync script
    let cleanPath = path.startsWith('/') ? path.slice(1) : path;
    if (!cleanPath) cleanPath = 'root';

    const segments = cleanPath.split('/').filter(Boolean);
    if (segments.length === 0) segments.push('root');

    // Remove 'api' segment if it exists
    const filteredSegments = segments.filter(segment => segment.toLowerCase() !== 'api');
    if (filteredSegments.length === 0) filteredSegments.push('root');

    // Create permission key using EXACT same format as sync script
    // Format: METHOD.segment1.segment2.segment3
    const pathSegments = filteredSegments.map(segment => 
      segment.startsWith(':') ? segment : segment
    );
    
    const key = `${method}.${pathSegments.join('.')}`;
    
    return key;
  }

  private async checkUserPermission(userId: number, permissionKey: string): Promise<boolean> {
    try {
      // Check if user has the required permission through any of their roles
      const userPermissions = await this.prisma.$queryRaw<Array<{key: string}>>`
        SELECT DISTINCT p.key
        FROM users u
        JOIN user_roles ur ON u.user_id = ur.user_id
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.permission_id
        WHERE u.user_id = ${userId}
      `;

      console.log(`👤 User ${userId} has permissions:`, userPermissions.map(p => p.key));
      console.log(`🔍 Looking for permission: ${permissionKey}`);
      
      const hasPermission = userPermissions.some(permission => permission.key === permissionKey);
      console.log(`✅ Permission check result: ${hasPermission}`);
      
      return hasPermission;
    } catch (error) {
      console.error('❌ Error checking user permission:', error);
      return false;
    }
  }
}
