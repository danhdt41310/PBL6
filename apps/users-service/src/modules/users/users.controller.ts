import { Controller, UnprocessableEntityException } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
import {
  UserResponseDto,
  UserListResponseDto,
  CreateUserResponseDto,
  AdminActionResponseDto,
  LoginResponseDto
} from './dto/user-response.dto';
import { CreateUserDto, LoginDto } from './dto/user.dto';
import { UserMapper } from './mapper';
import {
  ForgotPasswordResponseDto,
  VerifyCodeResponseDto,
  ResetPasswordResponseDto,
} from './dto/auth-response.dto';
import { UpdateProfileDto, UserStatus } from './dto/user.dto';
import { ForgotPasswordDto, ResetPasswordDto, VerifyCodeDto } from './dto/auth.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @MessagePattern('users.list')
  async findAll(@Payload() data: { page: number; limit: number }): Promise<UserListResponseDto> {
    console.log('Finding all users with pagination:', data);
    return await this.usersService.findAll(data.page, data.limit);
  }

  @MessagePattern('users.get_user')
  async findOne(@Payload() data: { id: number }): Promise<UserResponseDto | null> {
    console.log('Finding user with ID:', data.id);
    return await this.usersService.findOne(data.id);
  }

  @MessagePattern('users.change_password')
  async changePass(@Payload() data: { user_id: number, old_pass: string, new_pass: string }) {
    return await this.usersService.changePass(data.user_id, data.old_pass, data.new_pass);
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
}
