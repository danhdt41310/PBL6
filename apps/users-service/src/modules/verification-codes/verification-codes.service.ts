import { Injectable } from '@nestjs/common';
import { VerificationPurpose } from '@prisma/users-client';
import { VerificationCodesRepository, CreateVerificationCodeDto } from './verification-codes.repository';

@Injectable()
export class VerificationCodesService {
  constructor(
    private readonly verificationCodesRepository: VerificationCodesRepository,
  ) {}

  /**
   * Create a new verification code
   */
  async create(data: CreateVerificationCodeDto) {
    return this.verificationCodesRepository.create(data);
  }

  /**
   * Find a valid verification code
   */
  async findValid(userId: number, code: string, purpose: VerificationPurpose) {
    return this.verificationCodesRepository.findValid(userId, code, purpose);
  }

  /**
   * Mark verification code as used
   */
  async markAsUsed(id: number) {
    return this.verificationCodesRepository.markAsUsed(id);
  }

  /**
   * Delete verification codes by user and purpose
   */
  async deleteByUserAndPurpose(userId: number, purpose: VerificationPurpose) {
    return this.verificationCodesRepository.deleteByUserAndPurpose(userId, purpose);
  }

  /**
   * Delete expired verification codes (cleanup)
   */
  async deleteExpired() {
    return this.verificationCodesRepository.deleteExpired();
  }
}
