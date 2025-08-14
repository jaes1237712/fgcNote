import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Character } from 'src/character/entities/character.entity';
import { CharacterMoveImage } from 'src/character/entities/character-move-image.entity';
import { characterConfig } from 'src/config/character.config';
import * as fs from 'fs/promises';
import * as path from 'path';

interface FolderInfo {
  name: string;
  path: string;
  iconFile?: FileInfo;
  portraitFile?: FileInfo;
  numpadFiles: FileInfo[];
}

interface FileInfo {
  name: string;
  path: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
}

@Injectable()
export class CharacterSyncService {
  private readonly logger = new Logger(CharacterSyncService.name);

  constructor(
    @InjectRepository(Character)
    private characterRepository: Repository<Character>,
    @InjectRepository(CharacterMoveImage)
    private moveImageRepository: Repository<CharacterMoveImage>,
  ) {}

  async syncFromFileSystem(): Promise<{
    success: boolean;
    message: string;
    stats: any;
  }> {
    try {
      this.logger.log('開始同步檔案系統到資料庫...');

      const basePath = characterConfig.basePath;
      this.logger.log(`掃描路徑: ${basePath}`);
      this.logger.log(`當前工作目錄: ${process.cwd()}`);

      const characterFolders = await this.scanCharacterFolders(basePath);
      this.logger.log(`找到 ${characterFolders.length} 個角色資料夾`);

      let totalCharacters = 0;
      let totalImages = 0;
      let updatedCharacters = 0;
      let updatedImages = 0;

      for (const folder of characterFolders) {
        const result = await this.syncCharacter(folder);
        if (result.success) {
          totalCharacters++;
          totalImages += result.imageCount;
          if (result.updated) updatedCharacters++;
          if (result.imagesUpdated) updatedImages += result.imagesUpdated;
        }
      }

      const stats = {
        totalCharacters,
        totalImages,
        updatedCharacters,
        updatedImages,
        syncTime: new Date(),
      };

      this.logger.log(
        `同步完成: ${totalCharacters} 個角色, ${totalImages} 張圖片`,
      );

      return {
        success: true,
        message: '同步完成',
        stats,
      };
    } catch (error) {
      this.logger.error('同步失敗', error);
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      return {
        success: false,
        message: `同步失敗: ${errorMessage}`,
        stats: null,
      };
    }
  }

  private async scanCharacterFolders(basePath: string): Promise<FolderInfo[]> {
    const folders: FolderInfo[] = [];

    try {
      this.logger.log(`開始掃描資料夾: ${basePath}`);
      const entries = await fs.readdir(basePath, { withFileTypes: true });
      this.logger.log(`找到 ${entries.length} 個項目`);

      for (const entry of entries) {
        this.logger.log(
          `檢查項目: ${entry.name}, 類型: ${entry.isDirectory() ? '目錄' : '檔案'}`,
        );

        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const folderPath = path.join(basePath, entry.name);
          this.logger.log(`掃描角色資料夾: ${folderPath}`);

          const folderInfo = await this.scanCharacterFolder(
            folderPath,
            entry.name,
          );
          if (folderInfo) {
            folders.push(folderInfo);
          }
        }
      }
    } catch (error) {
      this.logger.error(`掃描資料夾失敗: ${basePath}`, error);
    }

    this.logger.log(`總共找到 ${folders.length} 個有效角色資料夾`);
    return folders;
  }

  private async scanCharacterFolder(
    folderPath: string,
    characterName: string,
  ): Promise<FolderInfo | null> {
    try {
      const entries = await fs.readdir(folderPath, { withFileTypes: true });
      const subfolders = entries.filter((entry) => entry.isDirectory());

      const folderInfo: FolderInfo = {
        name: characterName,
        path: folderPath,
        numpadFiles: [],
      };

      // 掃描 icon 子資料夾
      const iconFolder = subfolders.find((folder) => folder.name === 'icon');
      if (iconFolder) {
        const iconFiles = await this.scanImageFiles(
          path.join(folderPath, 'icon'),
        );
        if (iconFiles.length > 0) {
          folderInfo.iconFile = iconFiles[0];
        }
      }

      // 掃描 portrait 子資料夾
      const portraitFolder = subfolders.find(
        (folder) => folder.name === 'portrait',
      );
      if (portraitFolder) {
        const portraitFiles = await this.scanImageFiles(
          path.join(folderPath, 'portrait'),
        );
        if (portraitFiles.length > 0) {
          folderInfo.portraitFile = portraitFiles[0];
        }
      }

      // 掃描 numpad 子資料夾
      const numpadFolder = subfolders.find(
        (folder) => folder.name === 'numpad',
      );
      if (numpadFolder) {
        folderInfo.numpadFiles = await this.scanImageFiles(
          path.join(folderPath, 'numpad'),
        );
      }

      // 檢查是否有有效的圖片檔案
      const hasValidImages =
        folderInfo.iconFile ||
        folderInfo.portraitFile ||
        folderInfo.numpadFiles.length > 0;

      if (hasValidImages) {
        this.logger.log(
          `角色 ${characterName} 找到: icon=${!!folderInfo.iconFile}, portrait=${!!folderInfo.portraitFile}, numpad=${folderInfo.numpadFiles.length} 張`,
        );
        return folderInfo;
      }

      this.logger.log(`角色 ${characterName} 沒有找到有效圖片，跳過`);
      return null;
    } catch (error) {
      this.logger.error(`掃描角色資料夾失敗: ${folderPath}`, error);
      return null;
    }
  }

  private async scanImageFiles(folderPath: string): Promise<FileInfo[]> {
    const files: FileInfo[] = [];

    try {
      const entries = await fs.readdir(folderPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (characterConfig.supportedFormats.includes(ext)) {
            const filePath = path.join(folderPath, entry.name);
            const stats = await fs.stat(filePath);

            files.push({
              name: entry.name,
              path: filePath,
              size: stats.size,
              mimeType: this.getMimeType(ext),
            });
          }
        }
      }
    } catch (error) {
      this.logger.error(`掃描圖片檔案失敗: ${folderPath}`, error);
    }

    return files;
  }

  private getMimeType(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      '.webp': 'image/webp',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }

  private async syncCharacter(folderInfo: FolderInfo): Promise<{
    success: boolean;
    updated: boolean;
    imageCount: number;
    imagesUpdated: number;
  }> {
    try {
      let character = await this.characterRepository.findOne({
        where: { name: folderInfo.name },
      });

      const isNew = !character;
      if (isNew) {
        character = this.characterRepository.create({
          name: folderInfo.name,
          folderPath: this.toStaticPath(folderInfo.path),
        });
      } else if (character) {
        character.folderPath = this.toStaticPath(folderInfo.path);
        character.updatedAt = new Date();
      }

      if (character) {
        if (folderInfo.iconFile) {
          character.iconFilePath = this.toStaticPath(folderInfo.iconFile.path);
        }
        if (folderInfo.portraitFile) {
          character.portraitFilePath = this.toStaticPath(folderInfo.portraitFile.path);
        }

        // 先保存角色，確保有 ID
        const savedCharacter = await this.characterRepository.save(character);
        this.logger.log(
          `角色 ${savedCharacter.name} 已保存，ID: ${savedCharacter.id}`,
        );

        // 同步動作圖片（numpad 檔案）
        const imageResult = await this.syncCharacterMoveImages(
          savedCharacter,
          folderInfo.numpadFiles,
        );

        return {
          success: true,
          updated: !isNew,
          imageCount: folderInfo.numpadFiles.length,
          imagesUpdated: imageResult.updatedCount,
        };
      } else {
        this.logger.error(`同步角色未知失敗: ${folderInfo.name}`);
        return {
          success: false,
          updated: false,
          imageCount: 0,
          imagesUpdated: 0,
        };
      }
    } catch (error) {
      this.logger.error(`同步角色失敗: ${folderInfo.name}`, error);
      return {
        success: false,
        updated: false,
        imageCount: 0,
        imagesUpdated: 0,
      };
    }
  }

  private async syncCharacterMoveImages(
    character: Character,
    files: FileInfo[],
  ): Promise<{ updatedCount: number }> {
    let updatedCount = 0;

    // 刪除不存在的圖片記錄
    const existingImages = await this.moveImageRepository.find({
      where: { characterId: character.id },
    });

    const currentFileNames = files.map((file) => file.name);

    const imagesToDelete = existingImages.filter(
      (img) => !currentFileNames.includes(img.fileName),
    );

    if (imagesToDelete.length > 0) {
      await this.moveImageRepository.remove(imagesToDelete);
      this.logger.log(`刪除 ${imagesToDelete.length} 張不存在的動作圖片記錄`);
    }

    // 新增或更新圖片記錄
    for (const file of files) {
      let image = existingImages.find((img) => img.fileName === file.name);

      if (!image) {
        image = this.moveImageRepository.create({
          fileName: file.name,
          filePath: this.toStaticPath(file.path),
          fileSize: file.size,
          mimeType: file.mimeType,
          characterId: character.id,
        });
        updatedCount++;
      } else {
        // 檢查檔案是否有變更
        const newStaticPath = this.toStaticPath(file.path);
        if (image.fileSize !== file.size || image.filePath !== newStaticPath) {
          image.fileSize = file.size;
          image.filePath = newStaticPath;
          image.mimeType = file.mimeType;
          updatedCount++;
        }
      }

      await this.moveImageRepository.save(image);
    }

    return { updatedCount };
  }

  private toStaticPath(absolutePath: string): string {
    try {
      const assetsRoot = path.join(process.cwd(), 'assets');
      let relativePath = path.relative(assetsRoot, absolutePath);
      // Normalize to POSIX-style for URLs
      relativePath = relativePath.split(path.sep).join('/');
      if (!relativePath || relativePath.startsWith('..')) {
        // If outside assets, fall back to original name in assets root
        const baseName = path.basename(absolutePath);
        return `/assets/${baseName}`;
      }
      return `/assets/${relativePath}`;
    } catch (e) {
      return absolutePath;
    }
  }
}
