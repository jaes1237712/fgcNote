import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { ConfigService } from '@nestjs/config';
export declare class SessionGuard implements CanActivate {
    private readonly jwt;
    private readonly config;
    private readonly userRepo;
    constructor(jwt: JwtService, config: ConfigService, userRepo: Repository<User>);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
