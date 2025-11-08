import { Injectable, NotFoundException, BadRequestException, Logger, UnauthorizedException } from '@nestjs/common';
import {
  UserResponseDto,
  UserListResponseDto,
  AdminActionResponseDto,
  LoginResponseDto,
  CreateUserResponseDto,
  ChangePasswordResponseDto,
  RolePermissionResponseDto,
  UserListByEmailsOrIdsResponseDto
} from './dto/user-response.dto';
import { UserMapper } from './mapper/user.mapper';
import { CreateUserDto, LoginDto, UpdateProfileDto, UpdateUserDto, UserEmailsDto, UserStatus, RolePermissionDto, CreateRoleDto, CreatePermissionDto, UserIdsDto } from './dto/user.dto';
import { User } from './interfaces/user.interface';
import * as bcrypt from 'bcrypt';
import { ForgotPasswordResponseDto, VerifyCodeResponseDto, ResetPasswordResponseDto } from './dto/auth-response.dto';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { EmailService } from 'src/shared/email/email.service';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { QueryBuilderUtil, SearchFilter } from 'src/shared/utils/query-builder.util';
import { Prisma } from '@prisma/users-client'

@Injectable()
export class UsersService {
  private readonly salt_round = 10
  private readonly verificationCodeExpiryMinutes = 5

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService
  ) {}
  /**
   * Create a new User in the system
   *
   * @param createUserDto - Data Transfer Object containing the user information
   * @returns Promise<User> - The newly created user (including id, email, role, status...)
   * 
   **/
  async create(createUserDto: CreateUserDto): Promise<CreateUserResponseDto> {
    const { fullName, email, password, role, status, phone, dateOfBirth, gender } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, this.salt_round);
    
    // Prepare user data - only include dateOfBirth if valid
    const userData: Prisma.UserCreateInput = {
      full_name: fullName,
      email,
      password: hashedPassword,
      status: status || 'active',
    };

    // Add optional fields only if they have valid values
    if (phone) userData.phone = phone;
    if (gender) userData.gender = gender;
    if (dateOfBirth) {
      const parsedDate = new Date(dateOfBirth);
      // Only add date if it's valid
      if (!isNaN(parsedDate.getTime())) {
        userData.date_of_birth = parsedDate;
      }
    }
    
    // Create user without role first
    const newUser = await this.prisma.user.create({
      data: userData,
    });

    // Find the role by name and assign it to the user
    if (role) {
      const roleRecord = await this.prisma.role.findUnique({
        where: { name: role },
      });

      if (roleRecord) {
        await this.prisma.userRole.create({
          data: {
            user_id: newUser.user_id,
            role_id: roleRecord.role_id,
          },
        });
      }
    }

    // Fetch the user with roles for the response
    const userWithRoles = await this.prisma.user.findUnique({
      where: { user_id: newUser.user_id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return UserMapper.toCreateUserResponseDto(userWithRoles);
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
    
    if (!user) {
      throw new RpcException(new UnauthorizedException('Invalid email or password'))
    }
    if (user.status === 'blocked') {
      throw new RpcException(new UnauthorizedException('Your account has been blocked. Please contact support.'))
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new RpcException(new UnauthorizedException('Invalid email or password'))
    }

    // Get user's primary role (first role if multiple)
    const userRole = user.userRoles[0]?.role?.name || 'user';

    const payload = {
      sub: user.user_id,
      email: user.email,
      role: userRole,
      userId: user.user_id, // Add userId for the guard
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.ACCESS_JWT_SECRET || 'keybimat',
      expiresIn: '1h',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.REFRESH_JWT_SECRET || 'keybimat',
      expiresIn: '7d',
    });

    // Create user object with role for mapper
    const userWithRole = {
      ...user,
      role: userRole,
    };

    return {
      message: 'Login successful',
      success: true,
      user: UserMapper.toResponseDto(userWithRole),
      accessToken,
      refreshToken,
    };
  }


  async findAll(page: number, limit: number, filters?: SearchFilter): Promise<UserListResponseDto> {
    // Build the where clause using the query builder
    const where = QueryBuilderUtil.buildUserSearchQuery(filters || {});

    // Build pagination options
    const paginationOptions = QueryBuilderUtil.buildPaginationOptions(page, limit);

    // Execute queries in parallel
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        ...paginationOptions,
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Add role to each user for compatibility
    const usersWithRoles = users.map(user => ({
      ...user,
      role: user.userRoles[0]?.role?.name || 'user',
    }));

    return UserMapper.toUserListResponseDto(usersWithRoles, total, page, limit);
  }

  async findOne(user_id: number): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { user_id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) return null;
    
    // Add role for compatibility
    const userWithRole = {
      ...user,
      role: user.userRoles[0]?.role?.name || 'user',
    };
    
    const data = UserMapper.toResponseDto(userWithRole);
    return {
      data: data,
      success: true,
    }
  }

  /**
   * Get user with roles and permissions (consolidated endpoint)
   * Returns user info + roles array + permissions array
   */
  async findUserWithPermissions(user_id: number): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { user_id },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Extract roles
    const roles = user.userRoles.map(ur => ({
      role_id: ur.role.role_id,
      name: ur.role.name,
      description: ur.role.description,
    }));

    // Extract unique permissions from all roles
    const permissionsMap = new Map();
    user.userRoles.forEach(ur => {
      ur.role.rolePermissions.forEach(rp => {
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

    // Build user response with basic info
    const userWithRole = {
      ...user,
      role: user.userRoles[0]?.role?.name || 'user',
    };

    const userData = UserMapper.toResponseDto(userWithRole);

    return {
      success: true,
      data: {
        ...userData,
        roles,
        permissions,
      },
    };
  }

  async changePass(user_id: number, current_password: string, new_password: string): Promise<ChangePasswordResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { user_id }
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }
    
    const new_hashed_pass = await bcrypt.hash(new_password, this.salt_round);
    const updated_user = await this.prisma.user.update({
      where: { user_id },
      data: {
        password: new_hashed_pass,
        updated_at: new Date(),
      },
    });
    
    return {
      message: 'Password changed successfully'
    };
  }

  /**
   * Initiates the password reset process by sending a verification code to the user's email.
   * Validates email format and user existence.
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponseDto> {
    // Validate email format
    if (!email || !email.includes('@')) {
      throw new RpcException(new BadRequestException('Invalid email format'));
    }

    // Find the user by email
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new RpcException(new NotFoundException('Email không tồn tại trong hệ thống'));
    }

    // Check if user is blocked
    if (user.status === 'blocked') {
      throw new RpcException(new BadRequestException('Tài khoản của bạn đã bị khóa'));
    }

    // Generate a 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Calculate expiration time (5 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.verificationCodeExpiryMinutes);

    // Delete any existing password reset codes for this user
    await this.prisma.verificationCode.deleteMany({
      where: {
        user_id: user.user_id,
        purpose: 'PASSWORD_RESET',
      },
    });

    // Create a new verification code in the database
    await this.prisma.verificationCode.create({
      data: {
        code: verificationCode,
        purpose: 'PASSWORD_RESET',
        expires_at: expiresAt,
        user_id: user.user_id,
      },
    });

    // Send the verification code via email
    const emailSent = await this.emailService.sendPasswordResetEmail(
      user.email,
      verificationCode,
      user.full_name
    );

    if (!emailSent) {
      throw new RpcException(new BadRequestException('Không thể gửi email. Vui lòng thử lại sau.'));
    }

    return {
      message: 'Mã xác thực đã được gửi đến email của bạn.',
      success: true,
    };
  }

  /**
   * Verifies the code sent to the user's email
   * Validates email, code format, and checks if code is valid and not expired
   */
  async verifyCode(email: string, code: string): Promise<VerifyCodeResponseDto> {
    // Validate email format
    if (!email || !email.includes('@')) {
      throw new RpcException(new BadRequestException('Email không hợp lệ'));
    }

    // Validate code format
    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      throw new RpcException(new BadRequestException('Mã xác thực phải là 6 chữ số'));
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new RpcException(new NotFoundException('Email không tồn tại trong hệ thống'));
    }

    // Find the verification code
    const verificationCode = await this.prisma.verificationCode.findFirst({
      where: {
        user_id: user.user_id,
        code: code,
        purpose: 'PASSWORD_RESET',
        used: false,
        expires_at: {
          gt: new Date(),
        },
      },
    });

    if (!verificationCode) {
      throw new RpcException(new BadRequestException('Mã xác thực không hợp lệ hoặc đã hết hạn'));
    }

    return {
      message: 'Mã xác thực hợp lệ',
      success: true,
      isValid: true,
    };
  }

  /**
   * Resets the user's password using a verification code
   * Validates all inputs and ensures code is valid before resetting password
   */
  async resetPassword(email: string, code: string, newPassword: string): Promise<ResetPasswordResponseDto> {
    console.log('resetPassword called', { email, code });

    // Validate email format
    if (!email || !email.includes('@')) {
      throw new RpcException(new BadRequestException('Email không hợp lệ'));
    }

    // Validate code format
    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      throw new RpcException(new BadRequestException('Mã xác thực phải là 6 chữ số'));
    }

    // Validate password length
    if (!newPassword || newPassword.length < 6) {
      throw new RpcException(new BadRequestException('Mật khẩu phải có ít nhất 6 ký tự'));
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new RpcException(new NotFoundException('Email không tồn tại trong hệ thống'));
    }

    // Find and validate the verification code
    const verificationCode = await this.prisma.verificationCode.findFirst({
      where: {
        user_id: user.user_id,
        code: code,
        purpose: 'PASSWORD_RESET',
        used: false,
        expires_at: {
          gt: new Date(),
        },
      },
    });

    if (!verificationCode) {
      throw new RpcException(new BadRequestException('Mã xác thực không hợp lệ hoặc đã hết hạn'));
    }

    // Hash the new password before saving
    const newHashedPassword = await bcrypt.hash(newPassword, this.salt_round);

    // Update the user's password
    await this.prisma.user.update({
      where: { user_id: user.user_id },
      data: {
        password: newHashedPassword,
        updated_at: new Date(),
      },
    });

    // Mark the verification code as used
    await this.prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { used: true },
    });

    return {
      message: 'Đặt lại mật khẩu thành công',
      success: true,
    };
  }

  /**
   * Updates user's status (block/unblock) - Admin only
   */
  async updateUserStatus(userId: number, status: UserStatus): Promise<AdminActionResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new RpcException(new NotFoundException('User not found'))
    }

    const updatedUser = await this.prisma.user.update({
      where: { user_id: userId },
      data: {
        status: status,
        updated_at: new Date(),
      },
    });

    const action = status === UserStatus.ACTIVE ? 'activated' : 'blocked';

    return {
      message: `User has been ${action} successfully.`,
      success: true,
      user_id: updatedUser.user_id,
    };
  }

  /**
   * Updates user profile information
   */
  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Build the update data object with only provided fields
    const updateData: any = {
      updated_at: new Date(),
    };

    if (updateProfileDto.phone !== undefined) {
      updateData.phone = updateProfileDto.phone;
    }
    if (updateProfileDto.address !== undefined) {
      updateData.address = updateProfileDto.address;
    }
    if (updateProfileDto.dateOfBirth !== undefined) {
      updateData.date_of_birth = new Date(updateProfileDto.dateOfBirth);
    }
    if (updateProfileDto.gender !== undefined) {
      updateData.gender = updateProfileDto.gender;
    }
    if(updateProfileDto.fullName !== undefined) {
      updateData.full_name = updateProfileDto.fullName;
    }
    if(updateProfileDto.status !== undefined) {
      updateData.status = updateProfileDto.status;
    }

    const updatedUser = await this.prisma.user.update({
      where: { user_id: userId },
      data: updateData,
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Add role for compatibility
    const userWithRole = {
      ...updatedUser,
      role: updatedUser.userRoles[0]?.role?.name || 'user',
    };

    return UserMapper.toResponseDto(userWithRole);
  }
  
  async getListProfileByEmails(userEmails: UserEmailsDto): Promise<UserListByEmailsOrIdsResponseDto>{
    const records = [];
    for (let email of userEmails.userEmails){
      let user = await this.prisma.user.findUnique({
        where: { email: email },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
      
      if (user) {
        // Add role for compatibility
        const userWithRole = {
          ...user,
          role: user.userRoles[0]?.role?.name || 'user',
        };
        records.push(userWithRole);
      }
    }

    return {
      users: UserMapper.toResponseDtoArray(records),
    }
  }

  async getListProfileByIds(userIds: UserIdsDto): Promise<UserListByEmailsOrIdsResponseDto>{
    const records = [];
    for (let userId of userIds.userIds){
      let user = await this.prisma.user.findUnique({
        where: { user_id: userId },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
      
      if (user) {
        // Add role for compatibility
        const userWithRole = {
          ...user,
          role: user.userRoles[0]?.role?.name || 'user',
        };
        records.push(userWithRole);
      }
    }

    return {
      users: UserMapper.toResponseDtoArray(records),
    }
  }

  async getListProfileMatchEmail(emailPattern: string): Promise<UserListByEmailsOrIdsResponseDto>{
    const records = await this.prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      where: {
        email:{contains: emailPattern},
      },
      take: 100,
    })

    return {
      users: UserMapper.toResponseDtoArray(records),
    }
  }
  /**
   * Assign permissions to a role
   * Both the role and permissions must already exist in the database
   * @throws NotFoundException if role or any permission doesn't exist
   */
  async assignRolePermissions(rolePermissionDto: RolePermissionDto): Promise<RolePermissionResponseDto> {
    const { roleName, permissionNames } = rolePermissionDto;

    console.log(`Starting role permission assignment for role: ${roleName}, permissions: ${JSON.stringify(permissionNames)}`);

    try {
      // Use a transaction to ensure consistency
      return await this.prisma.$transaction(async (tx) => {
        // Find the role (must exist)
        const role = await tx.role.findUnique({
          where: { name: roleName }
        });

        if (!role) {
          console.log(`Role not found: ${roleName}`);
          throw new NotFoundException(`Role '${roleName}' not found. Please create the role first.`);
        } else {
          console.log(`Found existing role with ID: ${role.role_id}`);
        }

        const assignedPermissions: string[] = [];

        // Process each permission
        for (const permissionName of permissionNames) {
          console.log(`Processing permission: ${permissionName}`);
          
          // Find the permission (must exist)
          const permission = await tx.permission.findUnique({
            where: { key: permissionName }
          });

          if (!permission) {
            console.log(`Permission not found: ${permissionName}`);
            throw new NotFoundException(`Permission '${permissionName}' not found. Please create the permission first.`);
          } else {
            console.log(`Found existing permission with ID: ${permission.permission_id}`);
          }

          // Check if role-permission relationship already exists
          console.log(`Checking for existing relationship between role ${role.role_id} and permission ${permission.permission_id}`);
          const existingRolePermission = await tx.rolePermission.findFirst({
            where: {
              role_id: role.role_id,
              permission_id: permission.permission_id
            }
          });

          // Create the relationship only if it doesn't exist
          if (!existingRolePermission) {
            console.log(`Creating new role-permission relationship`);
            const newRolePermission = await tx.rolePermission.create({
              data: {
                role_id: role.role_id,
                permission_id: permission.permission_id
              }
            });
            console.log(`Successfully created role-permission relationship with ID: ${newRolePermission.role_permission_id}`);
          } else {
            console.log(`Role-permission relationship already exists with ID: ${existingRolePermission.role_permission_id}`);
          }

          assignedPermissions.push(permissionName);
        }

        return {
          message: `Successfully assigned ${assignedPermissions.length} permissions to role '${roleName}'`,
          success: true,
          roleName: roleName,
          permissionsAssigned: assignedPermissions
        };
      });

    } catch (error) {
      console.error('Error assigning permissions to role:', error);
      throw new BadRequestException(`Failed to assign permissions to role: ${error.message}`);
    }
  }

  /**
   * Get all roles with their associated permissions
   */
  async getAllRolesWithPermissions(): Promise<any> {
    try {
      const roles = await this.prisma.role.findMany({
        include: {
          rolePermissions: {
            include: {
              permission: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      return {
        message: 'Roles fetched successfully',
        roles: roles.map(role => ({
          role_id: role.role_id,
          name: role.name,
          description: role.description,
          created_at: role.created_at,
          permissions: role.rolePermissions.map(rp => ({
            permission_id: rp.permission.permission_id,
            key: rp.permission.key,
            name: rp.permission.name,
            description: rp.permission.description,
            resource: rp.permission.resource,
            action: rp.permission.action
          }))
        }))
      };
    } catch (error) {
      console.error('Error fetching roles with permissions:', error);
      throw new BadRequestException(`Failed to fetch roles: ${error.message}`);
    }
  }

  /**
   * Get all available permissions
   */
  async getAllPermissions(): Promise<any> {
    try {
      const permissions = await this.prisma.permission.findMany({
        orderBy: {
          key: 'asc'
        }
      });

      return {
        message: 'Permissions fetched successfully',
        permissions: permissions.map(permission => ({
          permission_id: permission.permission_id,
          key: permission.key,
          name: permission.name,
          description: permission.description,
          resource: permission.resource,
          action: permission.action,
          created_at: permission.created_at
        }))
      };
    } catch (error) {
      console.error('Error fetching permissions:', error);
      throw new BadRequestException(`Failed to fetch permissions: ${error.message}`);
    }
  }

  /**
   * Create a new role
   */
  async createRole(name: string, description?: string): Promise<any> {
    try {
      // Check if role already exists
      const existingRole = await this.prisma.role.findUnique({
        where: { name }
      });

      if (existingRole) {
        throw new BadRequestException(`Role '${name}' already exists`);
      }

      const role = await this.prisma.role.create({
        data: {
          name,
          description: description || `Role: ${name}`
        }
      });

      return {
        message: `Role '${name}' created successfully`,
        success: true,
        role: {
          role_id: role.role_id,
          name: role.name,
          description: role.description,
          created_at: role.created_at
        }
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error creating role:', error);
      throw new BadRequestException(`Failed to create role: ${error.message}`);
    }
  }

  /**
   * Create a new permission
   */
  async createPermission(key: string, name?: string, description?: string, resource?: string, action?: string): Promise<any> {
    try {
      // Check if permission already exists
      const existingPermission = await this.prisma.permission.findUnique({
        where: { key }
      });

      if (existingPermission) {
        throw new BadRequestException(`Permission '${key}' already exists`);
      }

      // Parse permission key if resource and action not provided
      let finalResource = resource;
      let finalAction = action;
      
      if (!resource || !action) {
        const parts = key.split('.');
        finalAction = finalAction || parts[0] || 'access';
        finalResource = finalResource || parts.slice(1).join('.') || key;
      }

      const permission = await this.prisma.permission.create({
        data: {
          key,
          name: name || key.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: description || `Permission: ${key}`,
          resource: finalResource,
          action: finalAction
        }
      });

      return {
        message: `Permission '${key}' created successfully`,
        success: true,
        permission: {
          permission_id: permission.permission_id,
          key: permission.key,
          name: permission.name,
          description: permission.description,
          resource: permission.resource,
          action: permission.action,
          created_at: permission.created_at
        }
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error creating permission:', error);
      throw new BadRequestException(`Failed to create permission: ${error.message}`);
    }
  }
}
