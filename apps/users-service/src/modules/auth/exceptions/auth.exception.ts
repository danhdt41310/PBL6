
import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '@repo/common';
import { USER_ERRORS } from '../../users/constants';
import { AUTH_ERRORS, VERIFICATION_CODE_ERRORS } from '../constants';

/**
 * Invalid Credentials Exception
 * Thrown when login credentials are incorrect
 */
export class InvalidCredentialsException extends BusinessException {
  constructor() {
    super(USER_ERRORS.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED, 'INVALID_CREDENTIALS');
  }
}

/**
 * Invalid Email Format Exception
 * Thrown when email format is invalid
 */
export class InvalidEmailFormatException extends BusinessException {
  constructor() {
    super(USER_ERRORS.INVALID_EMAIL_FORMAT, HttpStatus.BAD_REQUEST, 'INVALID_EMAIL_FORMAT');
  }
}

/**
 * Password Too Short Exception
 * Thrown when password doesn't meet minimum length
 */
export class PasswordTooShortException extends BusinessException {
  constructor() {
    super(USER_ERRORS.PASSWORD_MIN_LENGTH, HttpStatus.BAD_REQUEST, 'PASSWORD_TOO_SHORT');
  }
}

/**
 * Password Incorrect Exception
 * Thrown when current password is incorrect
 */
export class PasswordIncorrectException extends BusinessException {
  constructor() {
    super(USER_ERRORS.PASSWORD_INCORRECT, HttpStatus.BAD_REQUEST, 'PASSWORD_INCORRECT');
  }
}

/**
 * Password Mismatch Exception (alias for PasswordIncorrectException)
 * Thrown when current password doesn't match
 */
export class PasswordMismatchException extends BusinessException {
  constructor() {
    super(USER_ERRORS.PASSWORD_INCORRECT, HttpStatus.BAD_REQUEST, 'PASSWORD_MISMATCH');
  }
}

/**
 * Verification Code Format Exception
 * Thrown when verification code format is invalid
 */
export class VerificationCodeFormatException extends BusinessException {
  constructor() {
    super(VERIFICATION_CODE_ERRORS.INVALID_FORMAT, HttpStatus.BAD_REQUEST, 'VERIFICATION_CODE_FORMAT');
  }
}

/**
 * Invalid Verification Code Exception
 * Thrown when verification code is invalid or expired
 */
export class InvalidVerificationCodeException extends BusinessException {
  constructor(reason?: string) {
    const message = reason || VERIFICATION_CODE_ERRORS.INVALID;
    super(message, HttpStatus.BAD_REQUEST, 'INVALID_VERIFICATION_CODE');
  }
}

/**
 * Verification Code Expired Exception
 * Thrown when verification code has expired
 */
export class VerificationCodeExpiredException extends BusinessException {
  constructor() {
    super(VERIFICATION_CODE_ERRORS.EXPIRED, HttpStatus.BAD_REQUEST, 'VERIFICATION_CODE_EXPIRED');
  }
}

/**
 * Token Expired Exception
 * Thrown when JWT token has expired
 */
export class TokenExpiredException extends BusinessException {
  constructor() {
    super(AUTH_ERRORS.TOKEN_EXPIRED, HttpStatus.UNAUTHORIZED, 'TOKEN_EXPIRED');
  }
}

/**
 * Invalid Token Exception
 * Thrown when JWT token is invalid
 */
export class InvalidTokenException extends BusinessException {
  constructor() {
    super(AUTH_ERRORS.TOKEN_INVALID, HttpStatus.UNAUTHORIZED, 'INVALID_TOKEN');
  }
}

/**
 * Email Send Failed Exception
 * Thrown when email fails to send
 */
export class EmailSendFailedException extends BusinessException {
  constructor() {
    super('Failed to send email', HttpStatus.SERVICE_UNAVAILABLE, 'EMAIL_SEND_FAILED');
  }
}

/**
 * Email Not Found Exception
 * Thrown when email is not found in the system
 */
export class EmailNotFoundException extends BusinessException {
  constructor() {
    super(USER_ERRORS.EMAIL_NOT_FOUND, HttpStatus.NOT_FOUND, 'EMAIL_NOT_FOUND');
  }
}
