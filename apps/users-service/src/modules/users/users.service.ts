import { Injectable, NotFoundException, BadRequestException, Logger, UnauthorizedException } from '@nestjs/common';
import {
  UserResponseDto,
  UserListResponseDto,
  AdminActionResponseDto,
  LoginResponseDto,
  CreateUserResponseDto
} from './dto/user-response.dto';
import { UserMapper } from './mapper/user.mapper';
import { CreateUserDto, LoginDto, UpdateProfileDto, UpdateUserDto, UserStatus } from './dto/user.dto';
import { User } from './interfaces/user.interface';
import * as bcrypt from 'bcrypt';
import { ForgotPasswordResponseDto, VerifyCodeResponseDto, ResetPasswordResponseDto } from './dto/auth-response.dto';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { EmailService } from 'src/shared/email/email.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  private readonly salt_round = 10
  private readonly verificationCodeExpiryMinutes = 5

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService
  ) { }
  /**
 * Create a new User in the system
 *
 * @param createUserDto - Data Transfer Object containing the user information
 * @returns Promise<User> - The newly created user (including id, email, role, status...)
 * 
 **/
  async create(createUserDto: CreateUserDto): Promise<CreateUserResponseDto> {
    const { full_name, email, password, role, status } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, this.salt_round);
    const newUser = await this.prisma.user.create({
      data: {
        full_name,
        email,
        password: hashedPassword,
        role,
        status: status || 'active',
      },
    });
    return UserMapper.toCreateUserResponseDto(newUser);
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    })
    if (!user) {
      return {
        message: 'Invalid email or password',
        success: false,
      };
    }
    if (user.status === 'blocked') {
      return {
        message: 'Your account has been blocked. Please contact support.',
        success: false,
      };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return {
        message: 'Invalid email or password',
        success: false,
      };
    }

    const payload = {
      sub: user.user_id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.ACCESS_JWT_SECRET || 'access-secret',
      expiresIn: '1h',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.REFRESH_JWT_SECRET || 'refresh-secret',
      expiresIn: '7d',
    });

    return {
      message: 'Login successful',
      success: true,
      user: UserMapper.toResponseDto(user),
      accessToken,
      refreshToken,
    };
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

  async changePass(user_id: number, old_pass: string, new_pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { user_id }
    });
    if (!user) return null;
    const isMatch = await bcrypt.compare(old_pass, user.password);
    if (!isMatch) throw new Error('Password not match');
    const new_hashed_pass = await bcrypt.hash(new_pass, this.salt_round);
    const updated_user = await this.prisma.user.update({
      where: { user_id },
      data: {
        password: new_hashed_pass,
        updated_at: new Date(),
      },
    });
    return UserMapper.toUpdateUserResponseDto(updated_user);
  }

  /**
   * Initiates the password reset process by sending a verification code to the user's email
   * TODO: Write Filter to catch http errors, throw error without try catch
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponseDto> {
    // Find the user by email
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return {
        message: 'If your email is registered, you will receive a password reset code.',
        success: true,
      };
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
      return {
        message: 'Failed to send password reset email. Please try again later.',
        success: false,
      };
    }

    return {
      message: 'Password reset code has been sent to your email.',
      success: true,
    };
  }

  /**
   * Verifies the code sent to the user's email
   * TODO: Write Filter to catch http errors, throw error without try catch
   */
  async verifyCode(email: string, code: string): Promise<VerifyCodeResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return {
        message: 'Invalid verification code.',
        success: false,
        isValid: false,
      };
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
      return {
        message: 'Invalid or expired verification code.',
        success: false,
        isValid: false,
      };
    }

    return {
      message: 'Verification code is valid.',
      success: true,
      isValid: true,
    };
  }

  /**
   * Resets the user's password using a verification code
   */
  async resetPassword(email: string, code: string, newPassword: string): Promise<ResetPasswordResponseDto> {
    console.log('resetPassword called', { email, code });
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return {
        message: 'Invalid request.',
        success: false,
      };
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
      return {
        message: 'Invalid or expired verification code.',
        success: false,
      };
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
      message: 'Password has been reset successfully.',
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
      return {
        message: 'User not found.',
        success: false,
        user_id: userId,
      };
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
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { user_id: userId },
      data: {
        full_name: updateProfileDto.full_name,
        updated_at: new Date(),
      },
    });

    return UserMapper.toResponseDto(updatedUser);
  }
}
