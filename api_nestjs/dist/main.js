"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./root/app.module");
const cookieParser = require("cookie-parser");
const config_1 = require("@nestjs/config");
async function bootstrap() {
    var _a;
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const config = app.get(config_1.ConfigService);
    const originsRaw = config.get('CORS_ORIGINS');
    let corsOrigins = [
        'http://localhost:5173',
        'http://localhost:8080',
        'https://localhost:5173',
    ];
    if (Array.isArray(originsRaw)) {
        corsOrigins = originsRaw;
    }
    else if (typeof originsRaw === 'string' && originsRaw.trim().length > 0) {
        try {
            const parsed = JSON.parse(originsRaw);
            if (Array.isArray(parsed))
                corsOrigins = parsed;
        }
        catch {
            corsOrigins = originsRaw.split(',').map((s) => s.trim()).filter(Boolean);
        }
    }
    app.enableCors({
        origin: corsOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: '*',
        exposedHeaders: '*',
    });
    app.use(cookieParser());
    const port = (_a = config.get('PORT')) !== null && _a !== void 0 ? _a : 3000;
    await app.listen(port);
}
bootstrap();
