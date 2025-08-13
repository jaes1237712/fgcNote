export interface jwtPayLoad {
  sub: string; // user id
  iat: number;
  exp: number;
  iss: string;
  type: string;
}
