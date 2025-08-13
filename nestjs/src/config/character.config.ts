import { join } from 'path';

export const characterConfig = {
  basePath:
    process.env.CHARACTER_BASE_PATH ||
    join(process.cwd(), 'assets', 'characters'),
  supportedFormats: ['.webp', '.png', '.jpg', '.jpeg'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  defaultImageType: 'normal',
  syncBatchSize: 100, // 每次同步的批次大小
  retryAttempts: 3, // 同步失敗時的重試次數
};
