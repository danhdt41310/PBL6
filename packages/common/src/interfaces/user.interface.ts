/**
 * User Interface
 */
export interface IUser {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatar?: string;
  gender?: string;
  birthday?: Date | string;
  phoneNumber?: string;
  address?: string;
  roleId?: number;
  role?: IRole;
  status?: string;
  isBlocked?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Create User Input
 */
export interface ICreateUser {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  roleId?: number;
  gender?: string;
  birthday?: Date | string;
  phoneNumber?: string;
  address?: string;
}

/**
 * Update User Input
 */
export interface IUpdateUser {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  gender?: string;
  birthday?: Date | string;
  phoneNumber?: string;
  address?: string;
}

/**
 * User with Password (for auth operations)
 */
export interface IUserWithPassword extends IUser {
  password: string;
}

/**
 * Role Interface
 */
export interface IRole {
  id: number;
  name: string;
  description?: string;
  permissions?: IPermission[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Create Role Input
 */
export interface ICreateRole {
  name: string;
  description?: string;
}

/**
 * Update Role Input
 */
export interface IUpdateRole {
  name?: string;
  description?: string;
}

/**
 * Permission Interface
 */
export interface IPermission {
  id: number;
  key: string;
  name: string;
  description?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Create Permission Input
 */
export interface ICreatePermission {
  key: string;
  name: string;
  description?: string;
}

/**
 * Verification Code Interface
 */
export interface IVerificationCode {
  id: number;
  email: string;
  code: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}
