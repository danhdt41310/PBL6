export class ForgotPasswordResponseDto {
  message: string
  success: boolean
}

export class VerifyCodeResponseDto {
  message: string;
  success: boolean;
  isValid: boolean;
}

export class ResetPasswordResponseDto {
  message: string;
  success: boolean;
}
