import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Algorithm } from 'jsonwebtoken'; // 導入 Algorithm 類型

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  private readonly logger = new Logger(AuthService.name); // 初始化 Logger

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {
    this.googleClient = new OAuth2Client(this.config.get<string>('CLIENT_ID'));
  }

  async verifyGoogleToken(
    idToken: string,
  ): Promise<Pick<User, 'email' | 'name' | 'picture' | 'google_sub'>> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.config.get<string>('CLIENT_ID'),
      });
      const payload = ticket.getPayload() as TokenPayload;
      return {
        google_sub: payload.sub,
        email: payload.email!,
        name: payload.name ?? '',
        picture: payload.picture ?? null,
      };
    } catch (err) {
      if (err instanceof Error) {
        // 確保 err 是一個 Error 對象，以便訪問 message 和 stack
        this.logger.error(
          `Google token verification failed: ${err.message}`,
          err.stack,
        );
      } else {
        // 如果 err 不是 Error 對象，打印其本身
        this.logger.error(
          `Google token verification failed: ${JSON.stringify(err)}`,
        );
      }

      throw new UnauthorizedException('Invalid token');
    }
  }

  async createOrGetUserFromGoogle(info: {
    google_sub: string;
    email: string;
    name: string;
    picture: string | null;
  }): Promise<User> {
    let user = await this.userRepo.findOne({
      where: { google_sub: info.google_sub },
    });
    if (!user) {
      user = this.userRepo.create({
        google_sub: info.google_sub,
        email: info.email,
        name: info.name,
        picture: info.picture,
      });
      await this.userRepo.save(user);
    }
    return user;
  }

  createSessionJwt(userId: string): string {
    const expiresMinutes = Number(
      this.config.get<string>('JWT_EXPIRES_MINUTES') ?? '10080',
    );
    const nowSeconds = Math.floor(Date.now() / 1000);
    const exp = nowSeconds + expiresMinutes * 60;
    return this.jwt.sign(
      {
        sub: userId,
        iat: nowSeconds,
        exp,
        iss: 'fgcNote',
        typ: 'sess',
      },
      {
        secret: this.config.get<string>('JWT_SECRET')!,
        algorithm: this.config.get<Algorithm>('JWT_ALGORITHM'),
      },
    );
  }
}
