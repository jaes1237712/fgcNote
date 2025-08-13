import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { Algorithm } from 'jsonwebtoken'; // 導入 Algorithm 類型

@Injectable()
export class SessionGuard implements CanActivate {
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
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.config.get<string>('JWT_SECRET')!,
        algorithms: [this.config.get<Algorithm>('JWT_ALGORITHM') || 'HS256'],
      });
      const userId = payload?.sub as string | undefined;
      if (!userId) throw new UnauthorizedException('Invalid session payload');
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new UnauthorizedException('User not found');
      (req as any).user = user;
      return true;
    } catch (e) {
      throw new UnauthorizedException('Invalid session token');
    }
  }
}
