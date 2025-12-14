/**
 * Roles Module Error Messages
 * Error messages specific to roles module
 */
export const ROLE_ERRORS = {
  NOT_FOUND: 'Role not found',
  NOT_FOUND_BY_NAME: (name: string) => `Role '${name}' not found`,
  NOT_FOUND_BY_ID: (id: number) => `Role with ID '${id}' not found`,
  ALREADY_EXISTS: (name: string) => `Role '${name}' already exists`,
  HAS_USERS: (name: string, count: number) =>
    `Cannot delete role '${name}': ${count} users are still assigned`,
  CREATE_FAILED: 'Failed to create role',
  UPDATE_FAILED: 'Failed to update role',
  DELETE_FAILED: 'Failed to delete role',
} as const;

/**
 * Roles Module Success Messages
 * Success messages specific to roles module
 */
export const ROLE_SUCCESS = {
  CREATED: 'Role created successfully',
  UPDATED: 'Role updated successfully',
  DELETED: 'Role deleted successfully',
  FOUND: 'Role found successfully',
  LIST: 'Roles retrieved successfully',
  FETCHED: 'Roles retrieved successfully',
  PERMISSIONS_ASSIGNED: 'Permissions assigned to role successfully',
  CREATED_WITH_NAME: (name: string) => `Role '${name}' created successfully`,
  UPDATED_WITH_NAME: (name: string) => `Role '${name}' updated successfully`,
  DELETED_WITH_NAME: (name: string) => `Role '${name}' deleted successfully`,
  PERMISSIONS_UPDATED: (name: string, added: number, removed: number) =>
    `Role '${name}' permissions updated: ${added} added, ${removed} removed`,
} as const;
