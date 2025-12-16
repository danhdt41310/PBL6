import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { Prisma, AuditLogResource } from '@prisma/users-client';

import { UsersRepository } from './users.repository';
import { UserMapper } from './mapper/user.mapper';
import { QueryBuilderUtil, SearchFilter } from '../../shared/utils/query-builder.util';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AUDIT_LOG_ACTIONS } from '../audit-logs/constants';

import {
  CreateUserDto,
  UpdateProfileDto,
  UserEmailsDto,
  UserIdsDto,
} from './dto/user.dto';

import {
  UserResponseDto,
  UserListResponseDto,
  AdminActionResponseDto,
  CreateUserResponseDto,
  UserListByEmailsOrIdsResponseDto,
} from './dto/user-response.dto';

import { APP_CONFIG, USER_STATUS, UserStatus } from '@repo/common'; // Import USER_STATUS constant and UserStatus type
import { USER_SUCCESS } from './constants';
import { UserNotFoundException } from './exceptions';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  /**
   * Create a new User in the system
   */
  async create(createUserDto: CreateUserDto, actorInfo?: { userId: number; email: string; fullName: string }): Promise<CreateUserResponseDto> {
    const { fullName, email, password, role, status, phone, dateOfBirth, gender } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, APP_CONFIG.SALT_ROUNDS);

    const userData: Prisma.UserCreateInput = {
      full_name: fullName,
      email,
      password: hashedPassword,
      status: (status || USER_STATUS.ACTIVE) as any,
    };

    if (phone) userData.phone = phone;
    if (gender) userData.gender = gender;
    if (dateOfBirth) {
      const parsedDate = new Date(dateOfBirth);
      if (!isNaN(parsedDate.getTime())) {
        userData.date_of_birth = parsedDate;
      }
    }

    const newUser = await this.usersRepository.createUser(userData);

    if (role) {
      const roleRecord = await this.usersRepository.findRoleByName(role);
      if (roleRecord) {
        await this.usersRepository.createUserRole(newUser.user_id, roleRecord.role_id);
      }
    }

    const userWithRoles = await this.usersRepository.findUserById(newUser.user_id);

    // Log the creation
    if (actorInfo) {
      await this.auditLogsService.logAction(
        AUDIT_LOG_ACTIONS.USER_CREATED,
        AuditLogResource.USER,
        {
          actorId: actorInfo.userId,
          actorEmail: actorInfo.email,
          actorName: actorInfo.fullName,
          description: `Created new user: ${email}`,
          targetId: newUser.user_id.toString(),
          targetType: 'USER',
          newData: {
            user_id: newUser.user_id,
            email: newUser.email,
            full_name: newUser.full_name,
            status: newUser.status,
            role: role || APP_CONFIG.DEFAULT_ROLE,
          },
        },
      );
    }

    return UserMapper.toCreateUserResponseDto(userWithRoles);
  }

  /**
   * Get all users with pagination and filters
   */
  async findAll(page: number, limit: number, filters?: SearchFilter): Promise<UserListResponseDto> {
    const where = QueryBuilderUtil.buildUserSearchQuery(filters || {});
    const paginationOptions = QueryBuilderUtil.buildPaginationOptions(page, limit);

    const [users, total] = await Promise.all([
      this.usersRepository.findAllUsers(where, paginationOptions.skip, paginationOptions.take),
      this.usersRepository.countUsers(where),
    ]);

    const usersWithRoles = users.map((user) => ({
      ...user,
      role: user.userRoles[0]?.role?.name || APP_CONFIG.DEFAULT_ROLE,
    }));

    return UserMapper.toUserListResponseDto(usersWithRoles, total, page, limit);
  }

  /**
   * Get user by ID
   */
  async findOne(userId: number): Promise<any> {
    const user = await this.usersRepository.findUserById(userId);

    if (!user) return null;

    const userWithRole = {
      ...user,
      role: user.userRoles[0]?.role?.name || APP_CONFIG.DEFAULT_ROLE,
    };

    return {
      data: UserMapper.toResponseDto(userWithRole),
      success: true,
    };
  }

  /**
   * Get user with roles and permissions
   */
  async findUserWithPermissions(userId: number): Promise<any> {
    const user = await this.usersRepository.findUserByIdWithPermissions(userId);

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    const roles = user.userRoles.map((ur) => ({
      role_id: ur.role.role_id,
      name: ur.role.name,
      description: ur.role.description,
    }));

    const permissionsMap = new Map();
    user.userRoles.forEach((ur) => {
      ur.role.rolePermissions.forEach((rp) => {
        const permission = rp.permission;
        if (!permissionsMap.has(permission.permission_id)) {
          permissionsMap.set(permission.permission_id, {
            permission_id: permission.permission_id,
            key: permission.key,
            name: permission.name,
            description: permission.description,
            resource: permission.resource,
            action: permission.action,
          });
        }
      });
    });

    const permissions = Array.from(permissionsMap.values());
    const userWithRole = {
      ...user,
      role: user.userRoles[0]?.role?.name || APP_CONFIG.DEFAULT_ROLE,
    };

    return {
      success: true,
      data: {
        ...UserMapper.toResponseDto(userWithRole),
        roles,
        permissions,
      },
    };
  }

  /**
   * Update user status (block/unblock)
   */
  async updateUserStatus(
    userId: number,
    status: UserStatus,
    actorInfo?: { userId: number; email: string; fullName: string },
  ): Promise<AdminActionResponseDto> {
    const user = await this.usersRepository.findUserByIdSimple(userId);

    if (!user) {
      throw new RpcException(new UserNotFoundException(userId));
    }

    const oldStatus = user.status;
    const updatedUser = await this.usersRepository.updateUser(userId, {
      status: status as any, // Prisma expects enum value
      updated_at: new Date(),
    });

    const message = status === USER_STATUS.ACTIVE
      ? USER_SUCCESS.USER_ACTIVATED
      : USER_SUCCESS.USER_BLOCKED;

    // Log the status change
    if (actorInfo) {
      const action = status === USER_STATUS.BLOCKED
        ? AUDIT_LOG_ACTIONS.USER_BLOCKED
        : AUDIT_LOG_ACTIONS.USER_UNBLOCKED;

      await this.auditLogsService.logAction(
        action,
        AuditLogResource.USER,
        {
          actorId: actorInfo.userId,
          actorEmail: actorInfo.email,
          actorName: actorInfo.fullName,
          description: `Changed user status from ${oldStatus} to ${status}`,
          targetId: userId.toString(),
          targetType: 'USER',
          oldData: { status: oldStatus },
          newData: { status: updatedUser.status },
          changes: { status: { from: oldStatus, to: updatedUser.status } },
        },
      );
    }

    return {
      message,
      success: true,
      user_id: updatedUser.user_id,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
    actorInfo?: { userId: number; email: string; fullName: string },
  ): Promise<UserResponseDto> {
    const user = await this.usersRepository.findUserById(userId);

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // Store old data for audit log
    const oldData = {
      phone: user.phone,
      address: user.address,
      date_of_birth: user.date_of_birth,
      gender: user.gender,
      full_name: user.full_name,
      status: user.status,
    };

    const updateData: any = { updated_at: new Date() };

    if (updateProfileDto.phone !== undefined) updateData.phone = updateProfileDto.phone;
    if (updateProfileDto.address !== undefined) updateData.address = updateProfileDto.address;
    if (updateProfileDto.dateOfBirth !== undefined) updateData.date_of_birth = new Date(updateProfileDto.dateOfBirth);
    if (updateProfileDto.gender !== undefined) updateData.gender = updateProfileDto.gender;
    if (updateProfileDto.fullName !== undefined) updateData.full_name = updateProfileDto.fullName;
    if (updateProfileDto.status !== undefined) updateData.status = updateProfileDto.status;

    const updatedUser = await this.usersRepository.updateUserWithRoles(userId, updateData);

    const userWithRole = {
      ...updatedUser,
      role: updatedUser.userRoles[0]?.role?.name || APP_CONFIG.DEFAULT_ROLE,
    };

    // Log the profile update
    if (actorInfo) {
      await this.auditLogsService.logAction(
        AUDIT_LOG_ACTIONS.USER_PROFILE_UPDATED,
        AuditLogResource.USER,
        {
          actorId: actorInfo.userId,
          actorEmail: actorInfo.email,
          actorName: actorInfo.fullName,
          description: `Updated profile for user: ${user.email}`,
          targetId: userId.toString(),
          targetType: 'USER',
          oldData,
          newData: {
            phone: updatedUser.phone,
            address: updatedUser.address,
            date_of_birth: updatedUser.date_of_birth,
            gender: updatedUser.gender,
            full_name: updatedUser.full_name,
            status: updatedUser.status,
          },
        },
      );
    }

    return UserMapper.toResponseDto(userWithRole);
  }

  /**
   * Get list of user profiles by emails
   */
  async getListProfileByEmails(userEmails: UserEmailsDto): Promise<UserListByEmailsOrIdsResponseDto> {
    const records = await this.usersRepository.findUsersByEmails(userEmails.userEmails);

    const recordsWithRole = records.map((user) => ({
      ...user,
      role: user.userRoles[0]?.role?.name || APP_CONFIG.DEFAULT_ROLE,
    }));

    return { users: UserMapper.toResponseDtoArray(recordsWithRole) };
  }

  /**
   * Get list of user profiles by IDs
   */
  async getListProfileByIds(userIds: UserIdsDto): Promise<UserListByEmailsOrIdsResponseDto> {
    const records = await this.usersRepository.findUsersByIds(userIds.userIds);

    const recordsWithRole = records.map((user) => ({
      ...user,
      role: user.userRoles[0]?.role?.name || APP_CONFIG.DEFAULT_ROLE,
    }));

    return { users: UserMapper.toResponseDtoArray(recordsWithRole) };
  }

  /**
   * Get user profile by email
   */
  async getProfileByEmail(email: string): Promise<any> {
    const user = await this.usersRepository.findUserByEmail(email);

    if (!user) {
      throw new UserNotFoundException(email);
    }

    const userWithRole = {
      ...user,
      role: user.userRoles[0]?.role?.name || APP_CONFIG.DEFAULT_ROLE,
    };

    return { user: UserMapper.toResponseDto(userWithRole) };
  }

  /**
   * Get list of profiles matching email pattern
   */
  async getListProfileMatchEmail(emailPattern: string): Promise<UserListByEmailsOrIdsResponseDto> {
    const records = await this.usersRepository.findUsersByEmailPattern(
      emailPattern,
      APP_CONFIG.MAX_SEARCH_RESULTS,
    );

    return { users: UserMapper.toResponseDtoArray(records) };
  }

  /**
   * Search users by name or email
   */
  async searchUsersByNameOrEmail(
    searchPattern: string,
    excludeUserId?: number,
  ): Promise<UserListByEmailsOrIdsResponseDto> {
    const records = await this.usersRepository.searchUsersByNameOrEmail(
      searchPattern,
      excludeUserId,
      APP_CONFIG.SEARCH_RESULTS_LIMIT,
    );

    return { users: UserMapper.toResponseDtoArray(records) };
  }
}
