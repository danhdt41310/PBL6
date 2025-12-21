import { Controller, UnprocessableEntityException } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { UsersService } from './users.service';
import {
  UserResponseDto,
  UserListResponseDto,
  CreateUserResponseDto,
  AdminActionResponseDto,
  UserListByEmailsOrIdsResponseDto,
} from './dto/user-response.dto';
import {
  CreateUserDto,
  UserEmailsDto,
  UserIdsDto,
  UpdateProfileDto,
} from './dto/user.dto';
import { USER_PATTERNS, USER_STATUS, UserStatus, MICROSERVICE_CONTROLLER_PATHS } from '@repo/common'; // Import both constant and type

@Controller(MICROSERVICE_CONTROLLER_PATHS.USERS)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern(USER_PATTERNS.LIST)
  async findAll(
    @Payload()
    data: {
      page: number;
      limit: number;
      text: string;
      role: string;
      status: UserStatus;
      gender: string;
      birthday: Date;
    },
  ): Promise<UserListResponseDto> {
    const filter: any = {
      text: data.text,
      role: data.role,
      status: data.status,
      gender: data.gender,
      birthday: data.birthday,
    };
    return this.usersService.findAll(data.page, data.limit, filter);
  }

  @MessagePattern(USER_PATTERNS.GET_USER)
  async findOne(
    @Payload() data: { id: number },
  ): Promise<UserResponseDto | null> {
    return this.usersService.findOne(data.id);
  }

  @MessagePattern(USER_PATTERNS.GET_ME)
  async findOneWithPermissions(@Payload() data: { id: number }): Promise<any> {
    return this.usersService.findUserWithPermissions(data.id);
  }

  @MessagePattern(USER_PATTERNS.BLOCK_USER)
  async blockUser(
    @Payload() data: { 
      user_id: number;
      actorInfo?: { userId: number; email: string; fullName: string };
      auditContext?: { ipAddress?: string; userAgent?: string; requestMethod?: string; requestPath?: string };
    },
  ): Promise<AdminActionResponseDto> {
    return this.usersService.updateUserStatus(
      data.user_id, 
      USER_STATUS.BLOCKED, 
      data.actorInfo, 
      data.auditContext
    );
  }

  @MessagePattern(USER_PATTERNS.UNBLOCK_USER)
  async unblockUser(
    @Payload() data: { 
      user_id: number;
      actorInfo?: { userId: number; email: string; fullName: string };
      auditContext?: { ipAddress?: string; userAgent?: string; requestMethod?: string; requestPath?: string };
    },
  ): Promise<AdminActionResponseDto> {
    return this.usersService.updateUserStatus(
      data.user_id, 
      USER_STATUS.ACTIVE, 
      data.actorInfo, 
      data.auditContext
    );
  }

  @MessagePattern(USER_PATTERNS.UPDATE_PROFILE)
  async updateProfile(
    @Payload() data: { 
      user_id: number; 
      profile: UpdateProfileDto;
      actorInfo?: { userId: number; email: string; fullName: string };
      auditContext?: { ipAddress?: string; userAgent?: string; requestMethod?: string; requestPath?: string };
    },
  ): Promise<UserResponseDto> {
    return this.usersService.updateProfile(data.user_id, data.profile, data.actorInfo);
  }

  @MessagePattern(USER_PATTERNS.CREATE)
  async create(
    @Payload() data: CreateUserDto & { actorInfo?: { userId: number; email: string; fullName: string } },
  ): Promise<CreateUserResponseDto> {
    const { actorInfo, ...createUserDto } = data;
    return this.usersService.create(createUserDto, actorInfo);
  }

  @MessagePattern(USER_PATTERNS.GET_LIST_BY_EMAILS)
  async getListProfileByEmails(
    @Payload() userEmailsDto: UserEmailsDto,
  ): Promise<UserListByEmailsOrIdsResponseDto> {
    return this.usersService.getListProfileByEmails(userEmailsDto);
  }

  @MessagePattern(USER_PATTERNS.GET_LIST_BY_IDS)
  async getListProfileByIds(
    @Payload() userIdsDto: UserIdsDto,
  ): Promise<UserListByEmailsOrIdsResponseDto> {
    return this.usersService.getListProfileByIds(userIdsDto);
  }

  @MessagePattern(USER_PATTERNS.GET_BY_EMAIL)
  async getProfileByEmail(@Payload() data: { email: string }): Promise<any> {
    return this.usersService.getProfileByEmail(data.email);
  }

  @MessagePattern(USER_PATTERNS.GET_LIST_MATCH_EMAIL)
  async getListProfileMatchEmail(
    @Payload() data: { emailPattern: string },
  ): Promise<UserListByEmailsOrIdsResponseDto> {
    return this.usersService.getListProfileMatchEmail(data.emailPattern);
  }

  @MessagePattern(USER_PATTERNS.SEARCH_BY_NAME_OR_EMAIL)
  async searchUsersByNameOrEmail(
    @Payload() data: { searchPattern: string; excludeUserId?: number },
  ): Promise<UserListByEmailsOrIdsResponseDto> {
    return this.usersService.searchUsersByNameOrEmail(
      data.searchPattern,
      data.excludeUserId,
    );
  }
}
