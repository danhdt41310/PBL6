import { UserRole, UserStatus } from './user.dto';

export class UserResponseDto {
  user_id: number;
  full_name: string;
  email: string;
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
