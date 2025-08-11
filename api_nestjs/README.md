api_nestjs

NestJS backend providing the same functionality as the existing FastAPI app under `src/lib/api/`.

Endpoints

- POST `/auth/google-login` { id_token }
  - Verifies Google ID token, creates/gets user, sets `session` httpOnly cookie. Returns `true`.
- GET `/user/me` (auth required)
  - Returns the current user (fields similar to FastAPI `UserPublic`).
- GET `/user/search/:email` (auth required)
  - Returns `true` if a user with the email exists, else `false`.

Env vars

- `PORT` (default 3000)
- `SQLITE_URL` (e.g. `/home/hung/fgcNote/src/lib/api/dev.sqlite3`)
- `CORS_ORIGINS` JSON array or comma list
- `CLIENT_ID` Google OAuth Client ID
- `JWT_SECRET`, `JWT_ALGORITHM` (e.g. `HS256`), `JWT_EXPIRES_MINUTES` (e.g. `10080`)

Develop

```
npm i
npm run start:dev
```

Build & Run

```
npm run build
npm run start
```


