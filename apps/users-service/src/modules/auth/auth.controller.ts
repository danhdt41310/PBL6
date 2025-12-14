import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import {
  LoginDto,
  ForgotPasswordDto,
  VerifyCodeDto,
  ResetPasswordDto,
  LoginResponseDto,
  ForgotPasswordResponseDto,
  VerifyCodeResponseDto,
  ResetPasswordResponseDto,
  ChangePasswordResponseDto,
} from './dto';
import { AUTH_PATTERNS } from '@repo/common';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(AUTH_PATTERNS.LOGIN)
  async login(@Payload() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @MessagePattern(AUTH_PATTERNS.CHANGE_PASSWORD)
  async changePassword(
    @Payload() data: { user_id: number; current_password: string; new_password: string },
  ): Promise<ChangePasswordResponseDto> {
    return this.authService.changePassword(data.user_id, {
      currentPassword: data.current_password,
      newPassword: data.new_password,
    });
  }

  @MessagePattern(AUTH_PATTERNS.FORGOT_PASSWORD)
  async forgotPassword(
    @Payload() dto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponseDto> {
    return this.authService.forgotPassword(dto);
  }

  @MessagePattern(AUTH_PATTERNS.VERIFY_CODE)
  async verifyCode(
    @Payload() dto: VerifyCodeDto,
  ): Promise<VerifyCodeResponseDto> {
    return this.authService.verifyCode(dto);
  }

  @MessagePattern(AUTH_PATTERNS.RESET_PASSWORD)
  async resetPassword(
    @Payload() dto: ResetPasswordDto,
  ): Promise<ResetPasswordResponseDto> {
    return this.authService.resetPassword(dto);
  }
}
