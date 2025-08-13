import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { Algorithm } from 'jsonwebtoken'; // 導入 Algorithm 類型
import { jwtPayLoad } from 'src/auth/interface/jwt-pay-load.interface';

@Injectable()
export class SessionGuard implements CanActivate {
  private readonly logger = new Logger('Session_guard'); // 初始化 Logger
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.cookies?.['session'] as string;
    if (!token) {
      throw new UnauthorizedException('Missing session cookie');
    }

    try {
      const payload = await this.jwt.verifyAsync<jwtPayLoad>(token, {
        secret: this.config.get<string>('JWT_SECRET')!,
        algorithms: [this.config.get<Algorithm>('JWT_ALGORITHM') || 'HS256'],
      });
      const userId = payload.sub;
      if (!userId) throw new UnauthorizedException('Invalid session payload');
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new UnauthorizedException('User not found');
      req.user = user;
      return true;
    } catch (err) {
      if (err instanceof Error) {
        // 確保 err 是一個 Error 對象，以便訪問 message 和 stack
        this.logger.error(
          `Session token verification failed: ${err.message}`,
          err.stack,
        );
      } else {
        // 如果 err 不是 Error 對象，打印其本身
        this.logger.error(
          `Session token verification failed: ${JSON.stringify(err)}`,
        );
      }
      throw new UnauthorizedException('Invalid session token');
    }
  }
}
