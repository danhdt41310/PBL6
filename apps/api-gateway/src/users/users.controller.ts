import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe, Inject, HttpStatus, HttpException, ParseIntPipe, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateUserDto, UpdateUserDto, LoginDto } from '../dto/user.dto';
import { timeout, catchError } from 'rxjs/operators';
import { throwError, TimeoutError } from 'rxjs';
import { PaginationDto } from 'src/dto/common.dto';

@Controller('users')
export class UsersController {
  constructor(
    @Inject('USERS_SERVICE') private readonly usersClient: ClientProxy,
  ) {}

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
  changePass(@Param('id') id : number, @Body() data: {oldPass: string, newPass: string}){
    return this.usersClient.send('users.change_password', {user_id: id, old_pass: data.oldPass, new_pass: data.newPass});
  }
}
