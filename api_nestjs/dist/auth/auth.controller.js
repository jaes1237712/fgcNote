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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const config_1 = require("@nestjs/config");
class GoogleLoginBody {
}
let AuthController = class AuthController {
    constructor(auth, config) {
        this.auth = auth;
        this.config = config;
    }
    async googleLogin(body, res) {
        var _a, _b, _c;
        const info = await this.auth.verifyGoogleToken(body.id_token);
        const user = await this.auth.createOrGetUserFromGoogle(info);
        const jwt = this.auth.createSessionJwt(user.id);
        const origins = (_a = this.config.get('CORS_ORIGINS')) !== null && _a !== void 0 ? _a : [];
        const isDev = (_c = (_b = origins[0]) === null || _b === void 0 ? void 0 : _b.includes('localhost')) !== null && _c !== void 0 ? _c : true;
        res.cookie('session', jwt, {
            httpOnly: true,
            secure: !isDev,
            sameSite: isDev ? 'lax' : 'none',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 * 1000,
        });
        return true;
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('google-login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [GoogleLoginBody, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleLogin", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService, config_1.ConfigService])
], AuthController);
