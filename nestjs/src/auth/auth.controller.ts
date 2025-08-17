import { Body,Get, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import {
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserDto } from 'src/user/dto/user.dto';

class GoogleLoginBody {
  @ApiProperty()
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
  ): Promise<UserDto> {
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

  @Post('logout')
  @ApiOperation({ summary: 'Logout and clear session' })
  @ApiResponse({ status: 200, description: 'Logout successfully' })
  async logout(@Res({ passthrough: true }) res: Response): Promise<{ success: boolean }> {
    res.clearCookie('session', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
    console.log("使用者登出")
  return { success: true };
  }
}
