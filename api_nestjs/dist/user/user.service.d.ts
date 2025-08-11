import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
export declare class UserService {
    private readonly userRepo;
    constructor(userRepo: Repository<User>);
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
}
