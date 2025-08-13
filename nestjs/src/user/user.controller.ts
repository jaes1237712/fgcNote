import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { SessionGuard } from '../common/session.guard';
import type { Request } from 'express';
import { UserService } from './user.service';
import { User } from '../entities/user.entity';

@Controller('user')
export class UserController {
  constructor(private readonly users: UserService) {}

  @Get('me')
  @UseGuards(SessionGuard)
  async getMe(@Req() req: Request): Promise<{
    email: string;
    name: string;
    picture: string | null;
    google_sub: string;
    created_at: Date;
    updated_at: Date;
  }> {
    const u = (req as any).user as User;
    return {
      email: u.email,
      name: u.name,
      picture: u.picture,
      google_sub: u.google_sub,
      created_at: u.created_at,
      updated_at: u.updated_at,
    };
  }

  @Get('search/:email')
  @UseGuards(SessionGuard)
  async isYouThere(@Param('email') email: string): Promise<boolean> {
    const target = await this.users.findByEmail(email);
    return !!target;
  }
}
