import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { UserService } from './user.service';
import { UserDto } from './dto/user.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Algorithm } from 'jsonwebtoken'; // 導入 Algorithm 類型
import { SessionGuard } from 'src/common/session.guard';

@Controller('user')
export class UserController {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly userService: UserService,
  ) {}

  @Get('me')
  @UseGuards(SessionGuard)
  getMe(@Req() req: Request): UserDto | null {
    if (req.user) {
      return req.user;
    } else {
      return null;
    }
  }
}
