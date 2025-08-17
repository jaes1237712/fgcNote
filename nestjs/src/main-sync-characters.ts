import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/root/app.module';
import { CharacterSyncService } from 'src/character-db-sync/character-db-sync.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const syncService = app.get(CharacterSyncService);
    const result = await syncService.syncFromFileSystem();

    console.log(
      `[Character Sync] ${result.success ? '成功' : '失敗'} - ${result.message}`,
    );
    if (result.stats) {
      console.log(result.stats);
    }
  } catch (err) {
    console.error('[Character Sync] 執行期間發生錯誤:', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();
