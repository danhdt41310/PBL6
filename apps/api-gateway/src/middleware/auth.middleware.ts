import {
  HttpException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';

interface RequestWithUser extends Request {
  user?: any;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly rt_expiry = '7d';

  constructor(private readonly jwt: JwtService) {}

  async use(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      const access_jwt = this.extractTokenFromHeader(req, 'authorization');
      const refresh_jwt = this.extractTokenFromHeader(req, 'x-refresh-token');

      //   console.debug('[DEBUG] Access JWT: ', access_jwt)
      //   console.debug('[DEBUG] Refresh JWT: ', refresh_jwt)

      if (!access_jwt && !refresh_jwt) {
        throw new UnauthorizedException('Vui lòng đăng nhập');
      }

      if (access_jwt) {
        try {
          const payload = this.jwt.verify(access_jwt);

          req.user = payload;
          //   console.log('Access token hợp lệ:', payload);
          return next();
        } catch (error) {
          if (error instanceof TokenExpiredError) {
            console.log('Access token hết hạn, thử refresh token...');
          } else {
            console.log('Access token không hợp lệ:', error.message);
          }
        }
      }
      console.log(access_jwt);

      if (refresh_jwt) {
        try {
          const { accessToken, refreshToken, payload } =
            await this.refreshToken(refresh_jwt);

          req.user = payload;

          res.setHeader('x-access-token', accessToken);
          res.setHeader('x-refresh-token', refreshToken);

          console.log('Đã làm mới token thành công cho user:', payload.sub);
          return next();
        } catch (error) {
          if (error instanceof TokenExpiredError) {
            throw new UnauthorizedException(
              'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại',
            );
          }
          throw new UnauthorizedException(
            'Token không hợp lệ. Vui lòng đăng nhập lại',
          );
        }
      }

      throw new UnauthorizedException('Vui lòng đăng nhập để tiếp tục');
    } catch (error) {
      next(error);
    }
  }

  private extractTokenFromHeader(
    request: Request,
    type_of_token: 'authorization' | 'x-refresh-token',
  ): string | undefined {
    if (type_of_token === 'x-refresh-token') {
      return (request.headers[type_of_token] as string) ?? undefined;
    }

    const [type, token] = request.headers[type_of_token]?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async refreshToken(refresh_token: string) {
    try {
      const payload = await this.jwt.verifyAsync(refresh_token);

      const { accessToken, refreshToken } = await this.createTokens(payload);

      return {
        accessToken,
        refreshToken,
        payload,
      };
    } catch (error) {
      console.log('Refresh token error:', error.message);
      throw error;
    }
  }

  private async createTokens(payload: object) {
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.REFRESH_JWT_SECRET || 'keybimat',
      expiresIn: this.rt_expiry,
    });
    return { accessToken, refreshToken };
  }
}
