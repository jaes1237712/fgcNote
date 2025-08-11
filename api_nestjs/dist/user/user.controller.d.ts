import { Request } from 'express';
import { UserService } from './user.service';
export declare class UserController {
    private readonly users;
    constructor(users: UserService);
    getMe(req: Request): Promise<{
        email: string;
        name: string;
        picture: string | null;
        google_sub: string;
        created_at: Date;
        updated_at: Date;
    }>;
    isYouThere(email: string): Promise<boolean>;
}
