import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { VerificationPurpose } from '@prisma/users-client';

import { UsersRepository } from '../users/users.repository';
import { VerificationCodesRepository } from '../verification-codes/verification-codes.repository';
import { EmailService } from '../../shared/email/email.service';
import { UserMapper } from '../users/mapper/user.mapper';

import {
  LoginDto,
  ForgotPasswordDto,
  VerifyCodeDto,
  ResetPasswordDto,
  ChangePasswordDto,
  LoginResponseDto,
  ForgotPasswordResponseDto,
  VerifyCodeResponseDto,
  ResetPasswordResponseDto,
  ChangePasswordResponseDto,
} from './dto';

import {
  APP_CONFIG,
} from '@repo/common';

import { USER_SUCCESS } from '../users/constants';
import { AUTH_SUCCESS } from './constants';

import {
  InvalidCredentialsException,
  InvalidEmailFormatException,
  InvalidVerificationCodeException,
  PasswordTooShortException,
  PasswordIncorrectException,
  PasswordMismatchException,
  VerificationCodeFormatException,
  VerificationCodeExpiredException,
  EmailSendFailedException,
  EmailNotFoundException,
} from './exceptions';
import { UserNotFoundException, UserBlockedException } from '../users/exceptions';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly verificationCodesRepository: VerificationCodesRepository,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Authenticate user and generate tokens
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    const user = await this.usersRepository.findUserByEmail(email);

    if (!user) {
      throw new RpcException(new InvalidCredentialsException());
    }

    if (user.status === 'blocked') {
      throw new RpcException(new UserBlockedException());
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new RpcException(new InvalidCredentialsException());
    }

    const userRole = user.userRoles[0]?.role?.name || APP_CONFIG.DEFAULT_ROLE;

    const payload = {
      sub: user.user_id,
      email: user.email,
      role: userRole,
      userId: user.user_id,
      fullName: user.full_name,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.ACCESS_JWT_SECRET || 'keybimat',
      expiresIn: APP_CONFIG.ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.REFRESH_JWT_SECRET || 'keybimat',
      expiresIn: APP_CONFIG.REFRESH_TOKEN_EXPIRY,
    });

    const userWithRole = { ...user, role: userRole };

    return {
      message: USER_SUCCESS.LOGIN,
      success: true,
      user: UserMapper.toResponseDto(userWithRole),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<ChangePasswordResponseDto> {
    const { currentPassword, newPassword } = changePasswordDto;
    
    const user = await this.usersRepository.findUserByIdSimple(userId);

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new PasswordMismatchException();
    }

    const newHashedPassword = await bcrypt.hash(newPassword, APP_CONFIG.SALT_ROUNDS);
    await this.usersRepository.updateUser(userId, {
      password: newHashedPassword,
      updated_at: new Date(),
    });

    return { message: USER_SUCCESS.PASSWORD_CHANGED };
  }

  /**
   * Initiate password reset process
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<ForgotPasswordResponseDto> {
    const { email } = dto;
    
    if (!email || !email.includes('@')) {
      throw new RpcException(new InvalidEmailFormatException());
    }

    const user = await this.usersRepository.findUserByEmailSimple(email);
    if (!user) {
      throw new RpcException(new EmailNotFoundException());
    }

    if (user.status === 'blocked') {
      throw new RpcException(new UserBlockedException());
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + APP_CONFIG.VERIFICATION_CODE_EXPIRY_MINUTES);

    await this.verificationCodesRepository.deleteByUserAndPurpose(
      user.user_id,
      VerificationPurpose.PASSWORD_RESET,
    );

    await this.verificationCodesRepository.create({
      code: verificationCode,
      purpose: VerificationPurpose.PASSWORD_RESET,
      expiresAt: expiresAt,
      userId: user.user_id,
    });

    const emailSent = await this.emailService.sendPasswordResetEmail(
      user.email,
      verificationCode,
      user.full_name,
    );

    if (!emailSent) {
      throw new RpcException(new EmailSendFailedException());
    }

    return {
      message: USER_SUCCESS.VERIFICATION_CODE_SENT,
      success: true,
    };
  }

  /**
   * Verify password reset code
   */
  async verifyCode(dto: VerifyCodeDto): Promise<VerifyCodeResponseDto> {
    const { email, code } = dto;
    
    if (!email || !email.includes('@')) {
      throw new RpcException(new InvalidEmailFormatException());
    }

    if (!code || code.length !== APP_CONFIG.VERIFICATION_CODE_LENGTH || !/^\d{6}$/.test(code)) {
      throw new RpcException(new VerificationCodeFormatException());
    }

    const user = await this.usersRepository.findUserByEmailSimple(email);
    if (!user) {
      throw new RpcException(new EmailNotFoundException());
    }

    const verificationCode = await this.verificationCodesRepository.findValid(
      user.user_id,
      code,
      VerificationPurpose.PASSWORD_RESET,
    );

    if (!verificationCode) {
      throw new RpcException(new InvalidVerificationCodeException());
    }

    return {
      message: USER_SUCCESS.VERIFICATION_CODE_VALID,
      success: true,
      isValid: true,
    };
  }

  /**
   * Reset user password with verification code
   */
  async resetPassword(dto: ResetPasswordDto): Promise<ResetPasswordResponseDto> {
    const { email, code, password } = dto;
    
    if (!email || !email.includes('@')) {
      throw new RpcException(new InvalidEmailFormatException());
    }

    if (!code || code.length !== APP_CONFIG.VERIFICATION_CODE_LENGTH || !/^\d{6}$/.test(code)) {
      throw new RpcException(new VerificationCodeFormatException());
    }

    if (!password || password.length < 6) {
      throw new RpcException(new PasswordTooShortException());
    }

    const user = await this.usersRepository.findUserByEmailSimple(email);
    if (!user) {
      throw new RpcException(new EmailNotFoundException());
    }

    const verificationCode = await this.verificationCodesRepository.findValid(
      user.user_id,
      code,
      VerificationPurpose.PASSWORD_RESET,
    );

    if (!verificationCode) {
      throw new RpcException(new InvalidVerificationCodeException());
    }

    const newHashedPassword = await bcrypt.hash(password, APP_CONFIG.SALT_ROUNDS);

    await this.usersRepository.updateUser(user.user_id, {
      password: newHashedPassword,
      updated_at: new Date(),
    });

    await this.verificationCodesRepository.markAsUsed(verificationCode.id);

    return {
      message: USER_SUCCESS.PASSWORD_RESET,
      success: true,
    };
  }
}
