# API 整合說明

## 概述
這個專案使用 OpenAPI 自動生成 TypeScript 客戶端，確保前後端型別一致。

## 設置步驟

### 1. 安裝後端依賴
在 `nestjs` 目錄下安裝 Swagger 依賴：
```bash
cd nestjs
npm install @nestjs/swagger swagger-ui-express --legacy-peer-deps
```

### 2. 啟動後端服務
```bash
cd nestjs
npm run start:dev
```

### 3. 生成前端 API 客戶端
在 `sveltekit` 目錄下執行：
```bash
cd sveltekit
npm run generate-api
```

## 生成的文件結構
```
sveltekit/src/lib/api/generated/
├── index.ts          # 主要導出文件
├── client.ts         # API 客戶端
├── models.ts         # 型別定義
├── schemas.ts        # 驗證 schema
└── services.ts       # 服務層
```

## 使用方法

### 1. 導入生成的客戶端
```typescript
import { client } from '$lib/api/generated';
```

### 2. 調用 API
```typescript
// 獲取所有角色
const characters = await client.GET('/characters');

// 搜尋角色
const searchResult = await client.GET('/characters/search', {
  params: { query: { q: 'Ryu' } }
});

// 獲取角色圖片
const images = await client.GET('/characters/{id}/images', {
  params: { path: { id: 1 } }
});
```

### 3. 使用型別
```typescript
import type { Character, CharacterImage } from '$lib/api/generated';

// 型別安全的資料處理
const character: Character = characters.data[0];
const imageCount = character.imageCount;
```

## API 端點

### 角色管理
- `GET /characters` - 獲取所有角色
- `GET /characters/search?q={query}` - 搜尋角色
- `GET /characters/stats` - 獲取統計資訊
- `GET /characters/{id}` - 根據 ID 獲取角色
- `GET /characters/name/{name}` - 根據名稱獲取角色
- `GET /characters/{id}/images` - 獲取角色圖片

### 管理員功能
- `POST /admin/characters/sync` - 同步檔案系統
- `GET /admin/characters/sync/status` - 獲取同步狀態
- `GET /admin/characters/all` - 獲取所有角色（管理員視角）

## 開發流程

1. **修改後端 API**：在 NestJS 中修改控制器或實體
2. **更新 OpenAPI 文檔**：添加或修改 `@ApiProperty` 裝飾器
3. **重新生成客戶端**：執行 `npm run generate-api`
4. **使用新型別**：在前端使用新生成的型別和客戶端

## 注意事項

- 每次修改後端 API 後，都需要重新生成客戶端
- 生成的型別與後端完全一致，確保型別安全
- 使用 `client.GET()`, `client.POST()` 等方法調用 API
- 所有 API 調用都有完整的 TypeScript 支援

## 故障排除

### 生成失敗
- 確保後端服務正在運行
- 檢查 `http://localhost:3000/api` 是否可以訪問
- 檢查 OpenAPI 配置是否正確

### 型別錯誤
- 重新生成客戶端：`npm run generate-api`
- 檢查後端實體和 DTO 的 `@ApiProperty` 裝飾器
- 確保前後端版本一致
