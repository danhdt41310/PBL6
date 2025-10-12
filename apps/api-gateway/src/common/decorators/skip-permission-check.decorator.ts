import { SetMetadata } from '@nestjs/common';
import { SKIP_PERMISSION_CHECK } from '../guards/permissions.guard';

/**
 * Decorator to skip permission checks for specific endpoints
 * Use this for public endpoints or endpoints that have their own authorization logic
 */
export const SkipPermissionCheck = () => SetMetadata(SKIP_PERMISSION_CHECK, true);
