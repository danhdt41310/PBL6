/**
 * Permissions Module Error Messages
 * Error messages specific to permissions module
 */
export const PERMISSION_ERRORS = {
  NOT_FOUND: 'Permission not found',
  NOT_FOUND_BY_KEY: (key: string) => `Permission '${key}' not found`,
  ALREADY_EXISTS: (key: string) => `Permission '${key}' already exists`,
  CREATE_FAILED: 'Failed to create permission',
  UPDATE_FAILED: 'Failed to update permission',
  DELETE_FAILED: 'Failed to delete permission',
} as const;

/**
 * Permissions Module Success Messages
 * Success messages specific to permissions module
 */
export const PERMISSION_SUCCESS = {
  CREATED: 'Permission created successfully',
  UPDATED: 'Permission updated successfully',
  DELETED: 'Permission deleted successfully',
  FOUND: 'Permission found successfully',
  LIST: 'Permissions retrieved successfully',
  FETCHED: 'Permissions fetched successfully',
} as const;
