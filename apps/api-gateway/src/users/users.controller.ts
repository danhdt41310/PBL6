import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe, Inject, HttpStatus, HttpException, ParseIntPipe, Query, UseGuards, RequestTimeoutException, InternalServerErrorException, Req, Put, UseInterceptors, UseFilters } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';  import { CreateUserDto, UpdateUserDto, LoginDto, ForgotPasswordDto, VerifyCodeDto, ResetPasswordDto, UpdateProfileDto, ChangePasswordDto, UserEmailsDto, RolePermissionDto, CreateRoleDto, CreatePermissionDto, UserIdsDto } from '../dto/user.dto';
import { timeout, catchError } from 'rxjs/operators';
import { throwError, TimeoutError, firstValueFrom } from 'rxjs';
import { PaginationDto, UserSearchDto } from '../dto/common.dto';
import { Request } from 'express';
import { SkipPermissionCheck } from '../common/decorators/skip-permission-check.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';

interface RequestWithUser extends Request {
  user?: any;
}

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(
    @Inject('USERS_SERVICE') private readonly usersClient: ClientProxy,
  ) { }

  @Get('hello')
  @SkipPermissionCheck()
  @ApiOperation({ summary: 'Test endpoint', description: 'Simple hello endpoint for testing' })
  @ApiResponse({ status: 200, description: 'Returns hello message' })
  getHello(@Body() data: { name: string }) {
    return this.usersClient.send('users.get_hello', { name: data.name });
  }

  @Get('list')
  @ApiOperation({ summary: 'Get all users', description: 'Retrieve a paginated list of users with optional filters' })
  @ApiResponse({ status: 200, description: 'List of users retrieved successfully' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'text', required: false, type: String, description: 'Search text' })
  @ApiQuery({ name: 'role', required: false, type: String, description: 'Filter by role' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by status' })
  @ApiQuery({ name: 'gender', required: false, type: String, description: 'Filter by gender' })
  @ApiQuery({ name: 'birthday', required: false, type: String, description: 'Filter by birthday' })
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
   * Get current user with roles and permissions (consolidated endpoint)
   * Returns user info + roles + permissions in a single API call
   */
  @Get('me')
  @ApiOperation({ summary: 'Get current user', description: 'Get the currently authenticated user with roles and permissions' })
  @ApiResponse({ status: 200, description: 'Current user retrieved successfully' })
  @ApiResponse({ status: 401, description: 'User not authenticated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getCurrentUser(@Req() req: RequestWithUser) {
    if (!req.user || !req.user.sub) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    const userId = req.user.sub;
    console.log('Fetching user, roles, and permissions for user ID:', userId);
    try {
      return await this.usersClient
        .send('users.get_me', { id: userId })
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
      throw new HttpException('Failed to fetch user data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get current user profile from access token
   */
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile', description: 'Get the profile of the currently authenticated user' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'User not authenticated' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
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
  @ApiOperation({ summary: 'Update current user profile', description: 'Update the profile of the currently authenticated user' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'User not authenticated' })
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
  @ApiOperation({ summary: 'Get user by ID', description: 'Retrieve a specific user by their ID' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
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
  @ApiOperation({ summary: 'Change password', description: 'Change the password of the currently authenticated user' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'User not authenticated' })
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
  @ApiOperation({ summary: 'Forgot password', description: 'Initiate password reset process' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'Reset code sent successfully' })
  forgotPassword(@Body() data: ForgotPasswordDto) {
    return this.usersClient.send('users.forgot_password', data)
      .pipe(
        timeout(5000),
        catchError(err => {
          if (err instanceof TimeoutError) {
            return throwError(() => new HttpException('Request timed out', HttpStatus.REQUEST_TIMEOUT));
          }
          if (err?.error) {
            const rpcError = err.error;
            const statusCode = rpcError.statusCode || HttpStatus.BAD_REQUEST;
            const message = rpcError.message || 'Forgot password failed';
            return throwError(() => new HttpException(message, statusCode));
          }
          return throwError(() => new HttpException('Forgot password failed', HttpStatus.BAD_REQUEST));
        })
      );
  }

  @Post('verify-code')
  @SkipPermissionCheck()
  @ApiOperation({ summary: 'Verify reset code', description: 'Verify the password reset code' })
  @ApiBody({ type: VerifyCodeDto })
  @ApiResponse({ status: 200, description: 'Code verified successfully' })
  verifyCode(@Body() data: VerifyCodeDto) {
    return this.usersClient.send('users.verify_code', data)
      .pipe(
        timeout(5000),
        catchError(err => {
          if (err instanceof TimeoutError) {
            return throwError(() => new HttpException('Request timed out', HttpStatus.REQUEST_TIMEOUT));
          }
          if (err?.error) {
            const rpcError = err.error;
            const statusCode = rpcError.statusCode || HttpStatus.BAD_REQUEST;
            const message = rpcError.message || 'Code verification failed';
            return throwError(() => new HttpException(message, statusCode));
          }
          return throwError(() => new HttpException('Code verification failed', HttpStatus.BAD_REQUEST));
        })
      );
  }

  @Post('reset-password')
  @SkipPermissionCheck()
  @ApiOperation({ summary: 'Reset password', description: 'Reset password using verification code' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 408, description: 'Request timeout' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  resetPassword(@Body() data: ResetPasswordDto) {
    console.log('resetPassword called in controller', data);
    return this.usersClient.send('users.reset_password', data)
      .pipe(
        timeout(5000),
        catchError(error => {
          if (error instanceof TimeoutError) {
            return throwError(() => new RequestTimeoutException('Request timed out'));
          }
          if (error?.error) {
            const rpcError = error.error;
            const statusCode = rpcError.statusCode || HttpStatus.BAD_REQUEST;
            const message = rpcError.message || 'Failed to reset password';
            return throwError(() => new HttpException(message, statusCode));
          }
          return throwError(() => new InternalServerErrorException('Failed to reset password'));
        })
      ).toPromise()
  }

  /**
   * Admin user management
   */
  @Post('admin/block/:id')
  @ApiOperation({ summary: 'Block user', description: 'Block a user (Admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID to block' })
  @ApiResponse({ status: 200, description: 'User blocked successfully' })
  blockUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersClient.send('users.block_user', { user_id: id });
  }

  @Post('admin/unblock/:id')
  @ApiOperation({ summary: 'Unblock user', description: 'Unblock a user (Admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID to unblock' })
  @ApiResponse({ status: 200, description: 'User unblocked successfully' })
  unblockUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersClient.send('users.unblock_user', { user_id: id });
  }

  /**
   * User profile management
   */
  @Patch(':id/profile')
  @ApiOperation({ summary: 'Update user profile', description: 'Update a specific user profile (Admin)' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
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
  @ApiOperation({ summary: 'Create user', description: 'Create a new user account' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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
            if (err instanceof TimeoutError) {
              return throwError(() => new HttpException('Request timed out', HttpStatus.REQUEST_TIMEOUT));
            }
            // Extract error from RpcException
            if (err?.error) {
              const rpcError = err.error;
              const statusCode = rpcError.statusCode || HttpStatus.UNAUTHORIZED;
              const message = rpcError.message || 'Login failed';
              return throwError(() => new HttpException(message, statusCode));
            }
            return throwError(() => new HttpException('Login failed', HttpStatus.UNAUTHORIZED));
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
  // Get profile by other unique key
  //
  //
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

  @Post('get-list-profile-match-email')
  async getListProfileMatchEmail(@Body() body: {emailPattern :string} ){
    try {
      return await this.usersClient
        .send('users.get_list_profile_match_email', body)
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
      return await firstValueFrom(
        this.usersClient
          .send('users.assign_role_permissions', rolePermissionDto)
          .pipe(
            timeout(5000),
            catchError(err => {
              return throwError(() => new HttpException('Failed to assign permissions', HttpStatus.BAD_REQUEST));
            }),
          )
      );
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
      const result = await firstValueFrom(
        this.usersClient
          .send('users.get_all_roles', {})
          .pipe(
            timeout(5000),
            catchError(err => {
              return throwError(() => new HttpException('Failed to fetch roles', HttpStatus.INTERNAL_SERVER_ERROR));
            }),
          )
      );
      return result;
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
      return await firstValueFrom(
        this.usersClient
          .send('users.get_all_permissions', {})
          .pipe(
            timeout(5000),
            catchError(err => {
              return throwError(() => new HttpException('Failed to fetch permissions', HttpStatus.INTERNAL_SERVER_ERROR));
            }),
          )
      );
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
      return await firstValueFrom(
        this.usersClient
          .send('users.create_role', createRoleDto)
          .pipe(
            timeout(5000),
            catchError(err => {
              return throwError(() => new HttpException('Failed to create role', HttpStatus.BAD_REQUEST));
            }),
          )
      );
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
      return await firstValueFrom(
        this.usersClient
          .send('users.create_permission', createPermissionDto)
          .pipe(
            timeout(5000),
            catchError(err => {
              return throwError(() => new HttpException('Failed to create permission', HttpStatus.BAD_REQUEST));
            }),
          )
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to create permission', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Update a role (name and/or description)
   */
  @Put('admin/roles/:roleId')
  async updateRole(@Param('roleId') roleId: string, @Body() updateData: { name?: string; description?: string }) {
    try {
      return await firstValueFrom(
        this.usersClient
          .send('users.update_role', { role_id: parseInt(roleId, 10), ...updateData })
          .pipe(
            timeout(5000),
            catchError(err => {
              return throwError(() => new HttpException(
                err?.message || 'Failed to update role', 
                err?.statusCode || HttpStatus.BAD_REQUEST
              ));
            }),
          )
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to update role', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Delete a role (only if it has no users assigned)
   * Cascade deletes all rolePermission records
   */
  @Delete('admin/roles/:roleId')
  async deleteRole(@Param('roleId') roleId: string) {
    try {
      return await firstValueFrom(
        this.usersClient
          .send('users.delete_role', { role_id: parseInt(roleId, 10) })
          .pipe(
            timeout(5000),
            catchError(err => {
              return throwError(() => new HttpException(
                err?.message || 'Failed to delete role', 
                err?.statusCode || HttpStatus.BAD_REQUEST
              ));
            }),
          )
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to delete role', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
