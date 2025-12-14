import { Injectable } from '@nestjs/common';
import { VerificationPurpose } from '@prisma/users-client';
import { PrismaService } from '../../shared/prisma/prisma.service';

export interface CreateVerificationCodeDto {
  code: string;
  purpose: VerificationPurpose;
  expiresAt: Date;
  userId: number;
}

@Injectable()
export class VerificationCodesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new verification code
   */
  async create(data: CreateVerificationCodeDto) {
    return this.prisma.verificationCode.create({
      data: {
        code: data.code,
        purpose: data.purpose,
        expires_at: data.expiresAt,
        user_id: data.userId,
      },
    });
  }

  /**
   * Find a valid verification code
   */
  async findValid(userId: number, code: string, purpose: VerificationPurpose) {
    return this.prisma.verificationCode.findFirst({
      where: {
        user_id: userId,
        code: code,
        purpose: purpose,
        used: false,
        expires_at: {
          gt: new Date(),
        },
      },
    });
  }

  /**
   * Mark verification code as used
   */
  async markAsUsed(id: number) {
    return this.prisma.verificationCode.update({
      where: { id },
      data: { used: true },
    });
  }

  /**
   * Delete verification codes by user and purpose
   */
  async deleteByUserAndPurpose(userId: number, purpose: VerificationPurpose) {
    return this.prisma.verificationCode.deleteMany({
      where: {
        user_id: userId,
        purpose: purpose,
      },
    });
  }

  /**
   * Delete expired verification codes
   */
  async deleteExpired() {
    return this.prisma.verificationCode.deleteMany({
      where: {
        expires_at: {
          lt: new Date(),
        },
      },
    });
  }
}
