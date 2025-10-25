import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe, Inject, HttpStatus, HttpException, ParseIntPipe, Query, UseGuards, RequestTimeoutException, InternalServerErrorException, Req, Put, UseInterceptors, UseFilters } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';  import { CreateUserDto, UpdateUserDto, LoginDto, ForgotPasswordDto, VerifyCodeDto, ResetPasswordDto, UpdateProfileDto, ChangePasswordDto, UserEmailsDto, RolePermissionDto, CreateRoleDto, CreatePermissionDto, UserIdsDto } from '../dto/user.dto';
import { timeout, catchError } from 'rxjs/operators';
import { throwError, TimeoutError } from 'rxjs';
import { PaginationDto, UserSearchDto } from '../dto/common.dto';
import { Request } from 'express';
import { SkipPermissionCheck } from '../common/decorators/skip-permission-check.decorator';

interface RequestWithUser extends Request {
  user?: any;
}

@Controller('users')
export class UsersController {
  constructor(
    @Inject('USERS_SERVICE') private readonly usersClient: ClientProxy,
  ) { }

  @Get('hello')
  @SkipPermissionCheck()
  getHello(@Body() data: { name: string }) {
    return this.usersClient.send('users.get_hello', { name: data.name });
  }

  @Get('list')
  async findAll(@Query() searchDto: UserSearchDto) {
    const { page = 1, limit = 10, text, role, status, gender, birthday } = searchDto;
    try {
      return await this.usersClient
        .send('users.list', { page, limit, text, role, status, gender, birthday })
        .pipe(
          timeout(5000),
          catchError(err => {
            if (err instanceof TimeoutError) {
              return throwError(new HttpException('Request timed out', HttpStatus.REQUEST_TIMEOUT));
            }
            return throwError(new HttpException('Failed to fetch users', HttpStatus.INTERNAL_SERVER_ERROR));
          }),
        )
        .toPromise();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to fetch users', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get current user profile from access token
   */
  @Get('profile')
  async getProfile(@Req() req: RequestWithUser) {
    if (!req.user || !req.user.sub) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    const userId = req.user.sub;
    console.log('Fetching profile for user ID:', userId);
    try {
      return await this.usersClient
        .send('users.get_user', { id: userId })
        .pipe(
          timeout(5000),
          catchError(err => {
            return throwError(new HttpException('Profile not found', HttpStatus.NOT_FOUND));
          }),
        )
        .toPromise();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to fetch profile', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Update current user profile from access token
   */
  @Patch('profile')
  async updateCurrentProfile(@Req() req: RequestWithUser, @Body() profile: UpdateProfileDto) {
    if (!req.user || !req.user.sub) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    const userId = req.user.sub;
    
    try {
      return await this.usersClient
        .send('users.update_profile', { user_id: userId, profile })
        .pipe(
          timeout(5000),
          catchError(err => {
            return throwError(new HttpException('Failed to update profile', HttpStatus.BAD_REQUEST));
          }),
        )
        .toPromise();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to update profile', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.usersClient
        .send('users.get_user', { id })
        .pipe(
          timeout(5000),
          catchError(err => {
            return throwError(new HttpException('User not found', HttpStatus.NOT_FOUND));
          }),
        )
        .toPromise();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to fetch user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('/change-password')
  async changePass(@Req() req: RequestWithUser, @Body(ValidationPipe) changePasswordDto: ChangePasswordDto) {
    if (!req.user || !req.user.sub) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    const userId = req.user.sub;
    try {
      return await this.usersClient.send('users.change_password', { 
        user_id: userId, 
        current_password: changePasswordDto.currentPassword, 
        new_password: changePasswordDto.newPassword 
      })
      .pipe(
        timeout(5000),
        catchError(err => {
          return throwError(new HttpException('Failed to change password', HttpStatus.BAD_REQUEST));
        }),
      ).toPromise();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to change password', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Password reset flow
   */
  @Post('forgot-password')
  @SkipPermissionCheck()
  forgotPassword(@Body() data: ForgotPasswordDto) {
    return this.usersClient.send('users.forgot_password', data);
  }

  @Post('verify-code')
  @SkipPermissionCheck()
  verifyCode(@Body() data: VerifyCodeDto) {
    return this.usersClient.send('users.verify_code', data);
  }

  @Post('reset-password')
  @SkipPermissionCheck()
  resetPassword(@Body() data: ResetPasswordDto) {
    console.log('resetPassword called in controller', data);
    return this.usersClient.send('users.reset_password', data)
      .pipe(
        timeout(5000),
        catchError(error => {
          if (error instanceof TimeoutError) {
            return throwError(() => new RequestTimeoutException('Request timed out'));
          }

          return throwError(() => new InternalServerErrorException('Failed to reset password'));
        })
      ).toPromise()
  }

  /**
   * Admin user management
   */
  @Post('admin/block/:id')
  blockUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersClient.send('users.block_user', { user_id: id });
  }

  @Post('admin/unblock/:id')
  unblockUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersClient.send('users.unblock_user', { user_id: id });
  }

  /**
   * User profile management
   */
  @Patch(':id/profile')
  updateProfile(@Param('id', ParseIntPipe) id: number, @Body() profile: UpdateProfileDto) {
    return this.usersClient.send('users.update_profile', { user_id: id, profile });
  }

  /**
   * Create a new user
   * @param createUserDto - User creation data
   * @returns Created user response
   */
  @Post('create')
  @SkipPermissionCheck()
  async create(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    console.log("create user", createUserDto);
    return this.usersClient.send('users.create', createUserDto);
  }

  @Post('login')
  @SkipPermissionCheck()
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    try {
      return await this.usersClient
        .send('users.login', loginDto)
        .pipe(
          timeout(5000),
          catchError(err => {
            return throwError(() => new HttpException('User not found', HttpStatus.NOT_FOUND));
          }),
        )
        .toPromise();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Login failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('get-list-profile-by-emails')
  async getListProfileByEmail(@Body(ValidationPipe) userEmailsDto: UserEmailsDto ){
    try {
      return await this.usersClient
        .send('users.get_list_profile_by_emails', userEmailsDto)
        .pipe(
          timeout(5000),
          catchError(err => {
            return throwError(() => new HttpException('User not found', HttpStatus.NOT_FOUND));
          }),
        )
        .toPromise();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Login failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('get-list-profile-by-ids')
  async getListProfileById(@Body(ValidationPipe) userIdsDto: UserIdsDto ){
    try {
      return await this.usersClient
        .send('users.get_list_profile_by_ids', userIdsDto)
        .pipe(
          timeout(5000),
          catchError(err => {
            return throwError(() => new HttpException('User not found', HttpStatus.NOT_FOUND));
          }),
        )
        .toPromise();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Login failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Create/assign permissions to roles
   * Admin only endpoint for role permission management
   */
  @Post('admin/roles/assign-permissions')
  @SkipPermissionCheck()
  async assignPermissionsToRole(@Body(ValidationPipe) rolePermissionDto: RolePermissionDto) {
    try {
      return await this.usersClient
        .send('users.assign_role_permissions', rolePermissionDto)
        .pipe(
          timeout(5000),
          catchError(err => {
            return throwError(() => new HttpException('Failed to assign permissions', HttpStatus.BAD_REQUEST));
          }),
        )
        .toPromise();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to assign permissions to role', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get all roles with their permissions
   */
  @Get('admin/roles')
  @SkipPermissionCheck()
  async getAllRoles() {
    try {
      return await this.usersClient
        .send('users.get_all_roles', {})
        .pipe(
          timeout(5000),
          catchError(err => {
            return throwError(() => new HttpException('Failed to fetch roles', HttpStatus.INTERNAL_SERVER_ERROR));
          }),
        )
        .toPromise();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to fetch roles', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get all available permissions
   */
  @Get('admin/permissions')
  async getAllPermissions() {
    try {
      return await this.usersClient
        .send('users.get_all_permissions', {})
        .pipe(
          timeout(5000),
          catchError(err => {
            return throwError(() => new HttpException('Failed to fetch permissions', HttpStatus.INTERNAL_SERVER_ERROR));
          }),
        )
        .toPromise();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to fetch permissions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Create a new role
   */
  @Post('admin/roles/create')
  async createRole(@Body(ValidationPipe) createRoleDto: CreateRoleDto) {
    try {
      return await this.usersClient
        .send('users.create_role', createRoleDto)
        .pipe(
          timeout(5000),
          catchError(err => {
            return throwError(() => new HttpException('Failed to create role', HttpStatus.BAD_REQUEST));
          }),
        )
        .toPromise();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to create role', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Create a new permission
   */
  @Post('admin/permissions/create')
  async createPermission(@Body(ValidationPipe) createPermissionDto: CreatePermissionDto) {
    try {
      return await this.usersClient
        .send('users.create_permission', createPermissionDto)
        .pipe(
          timeout(5000),
          catchError(err => {
            return throwError(() => new HttpException('Failed to create permission', HttpStatus.BAD_REQUEST));
          }),
        )
        .toPromise();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to create permission', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}
