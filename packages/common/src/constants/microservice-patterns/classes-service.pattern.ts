/**
 * Class Management Message Patterns.
 * RPC communication patterns for class operations.
 */
export const CLASS_PATTERNS = {
  CREATE: 'classes.create',
  GET_BY_ID: 'classes.get_by_id',
  GET_ALL: 'classes.get_all',
  UPDATE: 'classes.update',
  DELETE: 'classes.delete',
  JOIN: 'classes.join',
  LEAVE: 'classes.leave',
  GET_MEMBERS: 'classes.get_members',
} as const;

export type ClassMessagePattern = (typeof CLASS_PATTERNS)[keyof typeof CLASS_PATTERNS];

/**
 * Post Management Message Patterns.
 * RPC communication patterns for class post operations.
 */
export const POST_PATTERNS = {
  CREATE: 'classes.create_post',
  GET_BY_CLASS: 'classes.get_posts',
  UPDATE: 'classes.update_post',
  DELETE: 'classes.delete_post',
} as const;

export type PostMessagePattern = (typeof POST_PATTERNS)[keyof typeof POST_PATTERNS];

/**
 * Material Management Message Patterns.
 * RPC communication patterns for class material operations.
 */
export const MATERIAL_PATTERNS = {
  UPLOAD: 'classes.upload_material',
  GET_BY_CLASS: 'classes.get_materials',
  DELETE: 'classes.delete_material',
} as const;

export type MaterialMessagePattern = (typeof MATERIAL_PATTERNS)[keyof typeof MATERIAL_PATTERNS];
