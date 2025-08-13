import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserDto } from 'src/user/dto/user.dto';

class GoogleLoginBody {
  id_token!: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google-login')
  @ApiOperation({
    summary: 'Google login and Create session',
  })
  @ApiResponse({
    status: 200,
    description: 'Login and Create Session successfully',
    type: UserDto,
  })
  async googleLogin(
    @Body() body: GoogleLoginBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    const info = await this.authService.verifyGoogleToken(body.id_token);
    const user = await this.authService.createOrGetUserFromGoogle(info);
    const jwt = this.authService.createSessionJwt(user.id);

    res.cookie('session', jwt, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 * 1000,
    });
    return user;
  }
}
