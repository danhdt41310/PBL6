import { User } from '../interfaces/user.interface';
import { 
  UserResponseDto, 
  UserListResponseDto, 
  CreateUserResponseDto, 
  UpdateUserResponseDto, 
  DeleteUserResponseDto 
} from '../dto/user-response.dto';

export class UserMapper {
  /**
   * Maps a User entity to UserResponseDto (excludes password)
   */
  static toResponseDto(user: User): UserResponseDto {
    return {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      role: user.role as any,
      status: user.status as any,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  /**
   * Maps an array of User entities to UserResponseDto array
   */
  static toResponseDtoArray(users: User[]): UserResponseDto[] {
    return users.map(user => this.toResponseDto(user));
  }

  /**
   * Maps users array with pagination info to UserListResponseDto
   */
  static toUserListResponseDto(
    users: User[], 
    total: number, 
    page: number, 
    limit: number
  ): UserListResponseDto {
    return {
      users: this.toResponseDtoArray(users),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Maps a newly created user to CreateUserResponseDto
   */
  static toCreateUserResponseDto(user: User): CreateUserResponseDto {
    return {
      message: 'User created successfully',
      user: this.toResponseDto(user),
    };
  }

  /**
   * Maps an updated user to UpdateUserResponseDto
   */
  static toUpdateUserResponseDto(user: User): UpdateUserResponseDto {
    return {
      message: 'User updated successfully',
      user: this.toResponseDto(user),
    };
  }

  /**
   * Maps a deleted user to DeleteUserResponseDto
   */
  static toDeleteUserResponseDto(user: User): DeleteUserResponseDto {
    return {
      message: 'User deleted successfully',
      user_id: user.user_id,
    };
  }

  /**
   * Maps multiple users to response DTOs with additional transformations
   */
  static toResponseDtoWithTransform(
    users: User[], 
    transform?: (user: UserResponseDto) => UserResponseDto
  ): UserResponseDto[] {
    const responseDtos = this.toResponseDtoArray(users);
    
    if (transform) {
      return responseDtos.map(transform);
    }
    
    return responseDtos;
  }

  /**
   * Maps a single user with custom fields inclusion/exclusion
   */
  static toCustomResponseDto(
    user: User, 
    includeFields?: (keyof UserResponseDto)[], 
    excludeFields?: (keyof UserResponseDto)[]
  ): Partial<UserResponseDto> {
    const baseResponse = this.toResponseDto(user);
    
    if (includeFields) {
      const result: Partial<UserResponseDto> = {};
      includeFields.forEach(field => {
        (result as any)[field] = baseResponse[field];
      });
      return result;
    }
    
    if (excludeFields) {
      const result = { ...baseResponse };
      excludeFields.forEach(field => {
        delete (result as any)[field];
      });
      return result;
    }
    
    return baseResponse;
  }
}
