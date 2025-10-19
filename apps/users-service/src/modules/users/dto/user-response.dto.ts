import { UserRole, UserStatus } from './user.dto';

export class UserResponseDto {
  user_id: number;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  dateOfBirth?: Date;
  gender?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  created_at: Date;
  updated_at?: Date | null;
}

export class UserListResponseDto {
  users: UserResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class CreateUserResponseDto {
  message: string;
  user: UserResponseDto;
}

export class UpdateUserResponseDto {
  message: string;
  user: UserResponseDto;
}

export class DeleteUserResponseDto {
  message: string;
  user_id: number;
}


// Response DTO for admin user operations
export class AdminActionResponseDto {
  message: string;
  success: boolean;
  user_id: number;
}

//Reponse DTO for login
export class LoginResponseDto {
  message: string;
  success: boolean;
  user?: UserResponseDto;
  accessToken?: string;
  refreshToken?: string;
}

export class ChangePasswordResponseDto {
  message: string;
}

export class UserListByEmailsOrIdsResponseDto {
  users: UserResponseDto[];
}

export class RolePermissionResponseDto {
  message: string;
  success: boolean;
  roleName: string;
  permissionsAssigned: string[];
}