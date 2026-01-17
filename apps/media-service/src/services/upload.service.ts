/**
 * Upload Service
 *
 * Dosya yükleme validasyonu ve ön işleme.
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@superapp/shared-logger';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class UploadService {
  private readonly maxFileSize: number;
  private readonly allowedImageFormats: string[];
  private readonly allowedVideoFormats: string[];
  private readonly allowedAudioFormats: string[];

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.maxFileSize = this.configService.get<number>('upload.maxFileSize');
    this.allowedImageFormats = this.configService.get<string[]>(
      'upload.image.allowedFormats',
    );
    this.allowedVideoFormats = this.configService.get<string[]>(
      'upload.video.allowedFormats',
    );
    this.allowedAudioFormats = this.configService.get<string[]>(
      'upload.audio.allowedFormats',
    );
  }

  /**
   * Dosya validasyonu
   */
  async validateFile(file: Express.Multer.File): Promise<FileValidationResult> {
    // Dosya boyutu kontrolü
    if (file.size > this.maxFileSize) {
      return {
        isValid: false,
        error: `Dosya boyutu çok büyük. Maksimum: ${this.formatBytes(this.maxFileSize)}`,
        mimeType: file.mimetype,
        size: file.size,
      };
    }

    // MIME type kontrolü
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    const isAudio = file.mimetype.startsWith('audio/');

    if (!isImage && !isVideo && !isAudio) {
      return {
        isValid: false,
        error: 'Desteklenmeyen dosya tipi',
        mimeType: file.mimetype,
        size: file.size,
      };
    }

    // Format kontrolü
    const ext = path.extname(file.originalname).toLowerCase().slice(1);

    if (isImage && !this.allowedImageFormats.includes(ext)) {
      return {
        isValid: false,
        error: `Desteklenmeyen resim formatı: ${ext}`,
        mimeType: file.mimetype,
        size: file.size,
      };
    }

    if (isVideo && !this.allowedVideoFormats.includes(ext)) {
      return {
        isValid: false,
        error: `Desteklenmeyen video formatı: ${ext}`,
        mimeType: file.mimetype,
        size: file.size,
      };
    }

    if (isAudio && !this.allowedAudioFormats.includes(ext)) {
      return {
        isValid: false,
        error: `Desteklenmeyen ses formatı: ${ext}`,
        mimeType: file.mimetype,
        size: file.size,
      };
    }

    // Dosya içeriği kontrolü (magic bytes)
    const isValidContent = await this.validateFileContent(file.path, file.mimetype);
    if (!isValidContent) {
      return {
        isValid: false,
        error: 'Dosya içeriği MIME tipi ile uyuşmuyor',
        mimeType: file.mimetype,
        size: file.size,
      };
    }

    return {
      isValid: true,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  /**
   * Dosya içeriği validasyonu (magic bytes)
   */
  private async validateFileContent(
    filePath: string,
    mimeType: string,
  ): Promise<boolean> {
    try {
      const buffer = Buffer.alloc(12);
      const fileHandle = await fs.open(filePath, 'r');
      await fileHandle.read(buffer, 0, 12, 0);
      await fileHandle.close();

      // Magic bytes kontrol
      // JPEG: FF D8 FF
      if (mimeType === 'image/jpeg') {
        return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      }

      // PNG: 89 50 4E 47
      if (mimeType === 'image/png') {
        return (
          buffer[0] === 0x89 &&
          buffer[1] === 0x50 &&
          buffer[2] === 0x4e &&
          buffer[3] === 0x47
        );
      }

      // GIF: 47 49 46 38
      if (mimeType === 'image/gif') {
        return (
          buffer[0] === 0x47 &&
          buffer[1] === 0x49 &&
          buffer[2] === 0x46 &&
          buffer[3] === 0x38
        );
      }

      // WebP: 52 49 46 46 ... 57 45 42 50
      if (mimeType === 'image/webp') {
        return (
          buffer[0] === 0x52 &&
          buffer[1] === 0x49 &&
          buffer[2] === 0x46 &&
          buffer[3] === 0x46 &&
          buffer[8] === 0x57 &&
          buffer[9] === 0x45 &&
          buffer[10] === 0x42 &&
          buffer[11] === 0x50
        );
      }

      // MP4: ... 66 74 79 70 (ftyp)
      if (mimeType === 'video/mp4' || mimeType === 'video/quicktime') {
        return (
          buffer[4] === 0x66 &&
          buffer[5] === 0x74 &&
          buffer[6] === 0x79 &&
          buffer[7] === 0x70
        );
      }

      // Diğer formatlar için true dön (genel kabul)
      return true;
    } catch (error) {
      this.logger.warn(
        `Dosya içerik kontrolü başarısız: ${error.message}`,
        'UploadService',
      );
      return false;
    }
  }

  /**
   * Byte formatla
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Geçici dosya oluştur
   */
  async createTempFile(buffer: Buffer, extension: string): Promise<string> {
    const tempDir = this.configService.get<string>('app.tempDir');
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${extension}`;
    const filePath = path.join(tempDir, fileName);

    await fs.writeFile(filePath, buffer);

    return filePath;
  }

  /**
   * Geçici dosyayı sil
   */
  async deleteTempFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      this.logger.warn(
        `Geçici dosya silinemedi: ${filePath}`,
        'UploadService',
      );
    }
  }
}
