import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { VerificationCodesModule } from '../verification-codes/verification-codes.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.ACCESS_JWT_SECRET || 'keybimat',
      signOptions: { expiresIn: '1h' },
    }),
    forwardRef(() => UsersModule),
    VerificationCodesModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
