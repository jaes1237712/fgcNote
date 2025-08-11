import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

class GoogleLoginBody {
  id_token!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}

  @Post('google-login')
  async googleLogin(@Body() body: GoogleLoginBody, @Res({ passthrough: true }) res: Response) {
    const info = await this.auth.verifyGoogleToken(body.id_token);
    const user = await this.auth.createOrGetUserFromGoogle(info);
    const jwt = this.auth.createSessionJwt(user.id);

    const origins = this.config.get<string[]>('CORS_ORIGINS') ?? [];
    const isDev = origins[0]?.includes('localhost') ?? true;

    res.cookie('session', jwt, {
      httpOnly: true,
      secure: !isDev,
      sameSite: isDev ? 'lax' : 'none',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 * 1000,
    });
    return true;
  }
}


