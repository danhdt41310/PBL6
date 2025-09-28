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
import * as bcrypt from 'bcrypt';
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private mailSer: MailerService) {}
  private readonly salt_round = 10;
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
    const isMatch = await bcrypt.compare(old_pass, user.password);
    if (!isMatch) throw new Error('Password not match');
    const new_hashed_pass = await bcrypt.hash(new_pass, this.salt_round);
    const updated_user = await this.prisma.user.update({
        where: {user_id},
        data: {
          password: new_hashed_pass,
          updated_at: new Date(),
        },
      });
    return UserMapper.toUpdateUserResponseDto(updated_user);
  }
}
