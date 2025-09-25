import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { 
  UserResponseDto, 
  UserListResponseDto, 
} from './dto/user-response.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  
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
  async changePass(@Payload() data:{user_id: number, old_pass: string, new_pass: string}){
    return await this.usersService.changePass(data.user_id, data.old_pass, data.new_pass);
  }
}
