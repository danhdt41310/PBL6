import { Controller, UnprocessableEntityException } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
import {
  UserResponseDto,
  UserListResponseDto,
  CreateUserResponseDto,
  AdminActionResponseDto,
  LoginResponseDto,
  ChangePasswordResponseDto,
  RolePermissionResponseDto,
  UserListByEmailsOrIdsResponseDto
} from './dto/user-response.dto';
import { CreateUserDto, LoginDto, UserEmailsDto, RolePermissionDto, CreateRoleDto, CreatePermissionDto, UserIdsDto } from './dto/user.dto';
import { UserMapper } from './mapper';
import {
  ForgotPasswordResponseDto,
  VerifyCodeResponseDto,
  ResetPasswordResponseDto,
} from './dto/auth-response.dto';
import { UpdateProfileDto, UserStatus, ChangePasswordDto } from './dto/user.dto';
import { ForgotPasswordDto, ResetPasswordDto, VerifyCodeDto } from './dto/auth.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @MessagePattern('users.list')
  async findAll(@Payload() data: { page: number; limit: number, text: string, role: string, status: UserStatus, gender: string, birthday: Date }): Promise<UserListResponseDto> {
    console.log('Finding all users with pagination:', data);
    const filter: any = {
      text: data.text,
      role: data.role,
      status: data.status,
      gender: data.gender,
      birthday: data.birthday,
    }
    return await this.usersService.findAll(data.page, data.limit, filter);
  }

  @MessagePattern('users.get_user')
  async findOne(@Payload() data: { id: number }): Promise<UserResponseDto | null> {
    console.log('Finding user with ID:', data.id);
    return await this.usersService.findOne(data.id);
  }

  @MessagePattern('users.get_me')
  async findOneWithPermissions(@Payload() data: { id: number }): Promise<any> {
    console.log('Finding user with permissions for ID:', data.id);
    return await this.usersService.findUserWithPermissions(data.id);
  }

  @MessagePattern('users.change_password')
  async changePass(@Payload() data: { user_id: number, current_password: string, new_password: string }): Promise<ChangePasswordResponseDto> {
    return await this.usersService.changePass(data.user_id, data.current_password, data.new_password);
  }

  @MessagePattern('users.forgot_password')
  async forgotPassword(@Payload() data: ForgotPasswordDto): Promise<ForgotPasswordResponseDto> {
    return await this.usersService.forgotPassword(data.email);
  }

  @MessagePattern('users.verify_code')
  async verifyCode(@Payload() data: VerifyCodeDto): Promise<VerifyCodeResponseDto> {
    return await this.usersService.verifyCode(data.email, data.code);
  }

  @MessagePattern('users.reset_password')
  async resetPassword(@Payload() data: ResetPasswordDto): Promise<ResetPasswordResponseDto> {
    return await this.usersService.resetPassword(data.email, data.code, data.password);
  }

  @MessagePattern('users.block_user')
  async blockUser(@Payload() data: { user_id: number }): Promise<AdminActionResponseDto> {
    throw new UnprocessableEntityException('This function is temporarily disabled');
    return await this.usersService.updateUserStatus(data.user_id, UserStatus.BLOCKED);
  }

  @MessagePattern('users.unblock_user')
  async unblockUser(@Payload() data: { user_id: number }): Promise<AdminActionResponseDto> {
    return await this.usersService.updateUserStatus(data.user_id, UserStatus.ACTIVE);
  }

  @MessagePattern('users.update_profile')
  async updateProfile(@Payload() data: { user_id: number, profile: UpdateProfileDto }): Promise<UserResponseDto> {
    return await this.usersService.updateProfile(data.user_id, data.profile);
  }

  @MessagePattern('users.create')
  async create(@Payload() createUserDto: CreateUserDto): Promise<CreateUserResponseDto> {
    console.log('Creating new user', createUserDto);
    return await this.usersService.create(createUserDto);
  }

  @MessagePattern('users.login')
  async login(@Payload() loginDto: LoginDto): Promise<LoginResponseDto> {
    console.log('User login attempt:', loginDto.email);
    return await this.usersService.login(loginDto);
  }

  @MessagePattern('user.get_list_profile_by_emails')
  async getListProfileByEmails(@Payload() userEmailsDto: UserEmailsDto): Promise<UserListByEmailsOrIdsResponseDto> {
    console.log('User get list profile by emails:', userEmailsDto);
    return await this.usersService.getListProfileByEmails(userEmailsDto);
  }

  @MessagePattern('user.get_list_profile_by_ids')
  async getListProfileByIds(@Payload() userIdsDto: UserIdsDto): Promise<UserListByEmailsOrIdsResponseDto> {
    console.log('User get list profile by ids:', userIdsDto);
    return await this.usersService.getListProfileByIds(userIdsDto);
  }

  @MessagePattern('user.get_list_profile_match_email')
  async getListProfileMatchEmail(@Payload() data: {emailPattern: string}): Promise<UserListByEmailsOrIdsResponseDto> {
    console.log('User get list profile match email:', data);
    return await this.usersService.getListProfileMatchEmail(data.emailPattern);
  }

  @MessagePattern('users.assign_role_permissions')
  async assignRolePermissions(@Payload() rolePermissionDto: RolePermissionDto): Promise<RolePermissionResponseDto> {
    console.log('Assigning permissions to role:', rolePermissionDto);
    return await this.usersService.assignRolePermissions(rolePermissionDto);
  }

  @MessagePattern('users.get_all_roles')
  async getAllRoles(): Promise<any> {
    console.log('Fetching all roles with permissions');
    return await this.usersService.getAllRolesWithPermissions();
  }

  @MessagePattern('users.get_all_permissions')
  async getAllPermissions(): Promise<any> {
    console.log('Fetching all permissions');
    return await this.usersService.getAllPermissions();
  }

  @MessagePattern('users.create_role')
  async createRole(@Payload() createRoleDto: CreateRoleDto): Promise<any> {
    console.log('Creating new role:', createRoleDto);
    return await this.usersService.createRole(createRoleDto.name, createRoleDto.description);
  }

  @MessagePattern('users.create_permission')
  async createPermission(@Payload() createPermissionDto: CreatePermissionDto): Promise<any> {
    console.log('Creating new permission:', createPermissionDto);
    return await this.usersService.createPermission(
      createPermissionDto.key,
      createPermissionDto.name,
      createPermissionDto.description,
      createPermissionDto.resource,
      createPermissionDto.action
    );
  }

}
