import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import 'reflect-metadata';

@Injectable()
export class PermissionSyncService {
  private readonly logger = new Logger(PermissionSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  async syncPermissions() {
    this.logger.log('Starting permission synchronization...');
    const permissions = this.discoverPermissions();

    this.logger.log(`Discovered ${permissions.length} permissions from controllers`);
    
    // Log all discovered permissions
    this.logger.log('All discovered permissions:');
    permissions.forEach((p, index) => {
      this.logger.log(`  ${index + 1}. ${p.key} - ${p.name}`);
    });

    const existingPermissions = await this.prisma.permission.findMany();
    this.logger.log(`Found ${existingPermissions.length} existing permissions in database`);
    
    const existingKeys = new Set(existingPermissions.map((p) => p.key));

    // Tìm các permission mới
    const newPermissions = permissions.filter((p) => !existingKeys.has(p.key));
    
    this.logger.log(`New permissions to create: ${newPermissions.length}`);
    newPermissions.forEach((p, index) => {
      this.logger.log(`  NEW ${index + 1}. ${p.key}`);
    });

    if (newPermissions.length > 0) {
      this.logger.log(`Creating ${newPermissions.length} new permissions...`);
      try {
        await this.prisma.permission.createMany({
          data: newPermissions,
          skipDuplicates: true,
        });
        this.logger.log('✅ New permissions created successfully');
      } catch (error) {
        this.logger.error('❌ Error creating permissions:', error);
      }
    } else {
      this.logger.log('No new permissions to create');
    }

    // Xóa các permission không còn tồn tại trong code
    const currentKeys = new Set(permissions.map((p) => p.key));
    const obsolete = existingPermissions.filter((p) => !currentKeys.has(p.key));

    if (obsolete.length > 0) {
      this.logger.log(`Removing ${obsolete.length} obsolete permissions...`);
      obsolete.forEach((p, index) => {
        this.logger.log(`  OBSOLETE ${index + 1}. ${p.key}`);
      });
      try {
        await this.prisma.permission.deleteMany({
          where: { key: { in: obsolete.map((p) => p.key) } },
        });
        this.logger.log('✅ Obsolete permissions removed successfully');
      } catch (error) {
        this.logger.error('❌ Error removing obsolete permissions:', error);
      }
    }

    // Final count verification
    const finalCount = await this.prisma.permission.count();
    this.logger.log(`Final permission count in database: ${finalCount}`);

    this.logger.log('Permission synchronization completed ✅');
  }

  private discoverPermissions() {
    const controllers = this.discoveryService.getControllers();
    const permissions = [];

    this.logger.log(`Found ${controllers.length} controllers to analyze`);

    for (const controller of controllers) {
      const { instance } = controller;
      if (!instance || !Object.getPrototypeOf(instance)) continue;

      const prototype = Object.getPrototypeOf(instance);
      const controllerName = instance.constructor.name;
      const controllerPath =
        this.reflector.get(PATH_METADATA, instance.constructor) || '';
      const methodNames = this.metadataScanner.getAllMethodNames(prototype);

      let controllerPermissions = 0;
      for (const methodName of methodNames) {
        const method = prototype[methodName];
        if (methodName === 'constructor' || typeof method !== 'function') continue;

        const httpMetadata = Reflect.getMetadata(METHOD_METADATA, method);
        
        if (httpMetadata === undefined || httpMetadata === null) {
          continue;
        }

        const httpMethod = Array.isArray(httpMetadata)
          ? httpMetadata[0]
          : httpMetadata;

        const routePath = Reflect.getMetadata(PATH_METADATA, method) || '';
        const fullPath = ['/', controllerPath, routePath]
          .filter(Boolean)
          .join('/')
          .replace(/\/+/g, '/')
          .replace(/\/$/, '');

        const permission = this.generatePermissionFromEndpoint(httpMethod, fullPath);
        if (permission) {
          permissions.push(permission);
          controllerPermissions++;
        }
      }
      
      this.logger.log(`  → ${controllerName}: ${controllerPermissions} permissions`);
    }

    return permissions;
  }

  private generatePermissionFromEndpoint(
    httpMethod: string | number,
    path: string,
  ) {
    const httpMethodMap = {
      0: 'GET',
      1: 'POST',
      2: 'PUT',
      3: 'DELETE',
      4: 'PATCH',
      5: 'OPTIONS',
      6: 'HEAD',
    };

    let methodString =
      typeof httpMethod === 'number'
        ? httpMethodMap[httpMethod] || 'UNKNOWN'
        : httpMethod.toUpperCase();

    let cleanPath = path.startsWith('/') ? path.slice(1) : path;
    if (!cleanPath) cleanPath = 'root';

    // Split path into segments and keep all of them to make unique keys
    const segments = cleanPath.split('/').filter(Boolean);
    if (segments.length === 0) segments.push('root');

    // Create a unique key using ALL path segments separated by commas
    // This ensures each endpoint has a unique permission key
    const pathSegments = segments.map(segment => 
      segment.startsWith(':') ? segment : segment
    );
    
    const key = `${methodString}.${pathSegments.join('.')}`;

    // For display name, create a readable version
    const displaySegments = segments.map(segment => 
      segment.startsWith(':') ? segment : segment
    );
    
    const mainResource = segments[0]?.replace(/^:/, '') || 'root';
    const lastSegment = segments[segments.length - 1] || segments[0] || 'root';
    const actionName = this.detectActionName(methodString, lastSegment);

    return {
      key,
      name: `${actionName} ${displaySegments.join(' ')}`,
      description: `Permission to access ${methodString} /${cleanPath}`,
      resource: mainResource,
      action: actionName.toLowerCase(),
    };
  }

  private detectActionName(httpMethod: string, lastSegment: string): string {
    const methodActionMap: Record<string, string> = {
      GET: 'View',
      POST: 'Create',
      PUT: 'Update',
      PATCH: 'Update',
      DELETE: 'Delete',
      OPTIONS: 'Options',
      HEAD: 'Head',
    };

    // Các hành động đặc biệt trong business logic
    const customActions = [
      'activate',
      'deactivate',
      'approve',
      'reject',
      'block',
      'unblock',
      'restore',
      'ban',
      'unban',
      'verify',
      'reset-password',
      'change-password',
    ];

    if (customActions.includes(lastSegment.toLowerCase())) {
      return (
        lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).toLowerCase()
      );
    }

    return methodActionMap[httpMethod] || httpMethod;
  }
}
