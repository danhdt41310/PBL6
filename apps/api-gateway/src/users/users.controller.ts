import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe, Inject, HttpStatus, HttpException, ParseIntPipe, Query, UseGuards, RequestTimeoutException, InternalServerErrorException, UseInterceptors, UseFilters } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateUserDto, UpdateUserDto, LoginDto, ForgotPasswordDto, VerifyCodeDto, ResetPasswordDto, UpdateProfileDto } from '../dto/user.dto';
import { timeout, catchError } from 'rxjs/operators';
import { throwError, TimeoutError } from 'rxjs';
import { PaginationDto } from 'src/dto/common.dto';

@Controller('users')
export class UsersController {
  constructor(
    @Inject('USERS_SERVICE') private readonly usersClient: ClientProxy,
  ) { }

  @Get('hello')
  getHello(@Body() data: { name: string }) {
    return this.usersClient.send('users.get_hello', { name: data.name });
  }

  @Get('list')
  async findAll(@Query() pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    try {
      return await this.usersClient
        .send('users.list', { page, limit })
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

  @Post(':id/changepass')
  changePass(@Param('id', ParseIntPipe) id: number, @Body() data: { oldPass: string, newPass: string }) {
    return this.usersClient.send('users.change_password', { user_id: id, old_pass: data.oldPass, new_pass: data.newPass });
  }

  /**
   * Password reset flow
   */
  @Post('forgot-password')
  forgotPassword(@Body() data: ForgotPasswordDto) {
    return this.usersClient.send('users.forgot_password', data);
  }

  @Post('verify-code')
  verifyCode(@Body() data: VerifyCodeDto) {
    return this.usersClient.send('users.verify_code', data);
  }

  @Post('reset-password')
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
  async create(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    console.log("create user", createUserDto);
    try {
      return await this.usersClient
        .send('users.create', createUserDto)
        .pipe(
          timeout(5000),
          catchError(err => {
            return throwError(() => new HttpException('fail to create', HttpStatus.NOT_FOUND));
          }),

        )
        .toPromise();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to create user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('login')
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


}
