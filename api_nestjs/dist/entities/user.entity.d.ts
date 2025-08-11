export declare class User {
    id: string;
    email: string;
    name: string;
    picture: string | null;
    google_sub: string;
    nickname: string | null;
    created_at: Date;
    updated_at: Date;
}
export declare class UserPublicDto {
    email: string;
    name: string;
    picture: string | null;
    google_sub: string;
    created_at: Date;
    updated_at: Date;
}
