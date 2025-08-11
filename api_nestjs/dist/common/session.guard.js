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
exports.SessionGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../entities/user.entity");
const config_1 = require("@nestjs/config");
let SessionGuard = class SessionGuard {
    constructor(jwt, config, userRepo) {
        this.jwt = jwt;
        this.config = config;
        this.userRepo = userRepo;
    }
    async canActivate(context) {
        var _a;
        const req = context.switchToHttp().getRequest();
        const token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a['session'];
        if (!token) {
            throw new common_1.UnauthorizedException('Missing session cookie');
        }
        try {
            const payload = await this.jwt.verifyAsync(token, {
                secret: this.config.get('JWT_SECRET'),
                algorithms: [this.config.get('JWT_ALGORITHM')],
            });
            const userId = payload === null || payload === void 0 ? void 0 : payload.sub;
            if (!userId)
                throw new common_1.UnauthorizedException('Invalid session payload');
            const user = await this.userRepo.findOne({ where: { id: userId } });
            if (!user)
                throw new common_1.UnauthorizedException('User not found');
            req.user = user;
            return true;
        }
        catch (e) {
            throw new common_1.UnauthorizedException('Invalid session token');
        }
    }
};
exports.SessionGuard = SessionGuard;
exports.SessionGuard = SessionGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        typeorm_2.Repository])
], SessionGuard);
