import { Response } from 'express';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
declare class GoogleLoginBody {
    id_token: string;
}
export declare class AuthController {
    private readonly auth;
    private readonly config;
    constructor(auth: AuthService, config: ConfigService);
    googleLogin(body: GoogleLoginBody, res: Response): Promise<boolean>;
}
export {};
