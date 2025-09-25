import { Injectable } from '@nestjs/common';
import { 
  UserResponseDto, 
  UserListResponseDto, 
} from './dto/user-response.dto';
import { UserMapper } from './mapper/user.mapper';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailerService } from '@nestjs-modules/mailer';
import { CreateUserDto } from './dto/user.dto';
import { User } from './interfaces/user.interface';
@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService, private mailSer: MailerService) {}
  private readonly expired_verify_otp = 5*60*1000;

  async create(createUserDto: CreateUserDto): Promise<User> {
    return await this.prisma.user.create({
      data: createUserDto,
    });
  }

  async findAll(page: number, limit: number): Promise<UserListResponseDto> {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count(),
    ]);
    
    return UserMapper.toUserListResponseDto(users, total, page, limit);
  }

  async findOne(user_id: number): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { user_id },
    });
    
    if (!user) return null;
    return UserMapper.toResponseDto(user);
  }

  async changePass(user_id:number, old_pass: string, new_pass:string){
    const user = await this.prisma.user.findUnique({
      where: {user_id}
    });
    if (!user) return null;
    if (user.password !== old_pass)  throw new Error('Old password not matched');
    const updated_user = await this.prisma.user.update({
        where: {user_id},
        data: {
          password: new_pass,
          updated_at: new Date(),
        },
      });
    return UserMapper.toUpdateUserResponseDto(updated_user);
  }
}
