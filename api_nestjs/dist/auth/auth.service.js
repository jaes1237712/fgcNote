"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const google_auth_library_1 = require("google-auth-library");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../entities/user.entity");
let AuthService = class AuthService {
    constructor(jwt, config, userRepo) {
        this.jwt = jwt;
        this.config = config;
        this.userRepo = userRepo;
        this.googleClient = new google_auth_library_1.OAuth2Client(this.config.get('CLIENT_ID'));
    }
    async verifyGoogleToken(idToken) {
        var _a, _b;
        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken,
                audience: this.config.get('CLIENT_ID'),
            });
            const payload = ticket.getPayload();
            return {
                google_sub: payload.sub,
                email: payload.email,
                name: (_a = payload.name) !== null && _a !== void 0 ? _a : '',
                picture: (_b = payload.picture) !== null && _b !== void 0 ? _b : null,
            };
        }
        catch (err) {
            throw new common_1.UnauthorizedException('Invalid token');
        }
    }
    async createOrGetUserFromGoogle(info) {
        let user = await this.userRepo.findOne({ where: { google_sub: info.google_sub } });
        if (!user) {
            user = this.userRepo.create({
                google_sub: info.google_sub,
                email: info.email,
                name: info.name,
                picture: info.picture,
            });
            await this.userRepo.save(user);
        }
        return user;
    }
    createSessionJwt(userId) {
        var _a;
        const expiresMinutes = Number((_a = this.config.get('JWT_EXPIRES_MINUTES')) !== null && _a !== void 0 ? _a : '10080');
        const nowSeconds = Math.floor(Date.now() / 1000);
        const exp = nowSeconds + expiresMinutes * 60;
        return this.jwt.sign({
            sub: userId,
            iat: nowSeconds,
            exp,
            iss: 'fgcNote',
            typ: 'sess',
        }, {
            secret: this.config.get('JWT_SECRET'),
            algorithm: this.config.get('JWT_ALGORITHM'),
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        typeorm_2.Repository])
], AuthService);
