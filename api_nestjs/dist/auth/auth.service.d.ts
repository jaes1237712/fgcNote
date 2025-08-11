import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
export declare class AuthService {
    private readonly jwt;
    private readonly config;
    private readonly userRepo;
    private googleClient;
    constructor(jwt: JwtService, config: ConfigService, userRepo: Repository<User>);
    verifyGoogleToken(idToken: string): Promise<Pick<User, 'email' | 'name' | 'picture' | 'google_sub'>>;
    createOrGetUserFromGoogle(info: {
        google_sub: string;
        email: string;
        name: string;
        picture: string | null;
    }): Promise<User>;
    createSessionJwt(userId: string): string;
}
