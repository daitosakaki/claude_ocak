/**
 * Thumbnail Service
 *
 * Resim ve video için thumbnail oluşturma servisi.
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@superapp/shared-logger';
import * as sharp from 'sharp';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ThumbnailData } from '../dto/media-response.dto';

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface VideoThumbnailOptions extends ThumbnailOptions {
  timestamp?: string; // Format: "00:00:01"
}

@Injectable()
export class ThumbnailService {
  private readonly defaultOptions: ThumbnailOptions;
  private readonly tempDir: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    const config = this.configService.get('upload.thumbnail');
    this.defaultOptions = {
      width: config.width,
      height: config.height,
      quality: config.quality,
      fit: config.fit,
    };
    this.tempDir = this.configService.get<string>('app.tempDir');
  }

  /**
   * Resimden thumbnail oluştur
   */
  async createFromImage(
    filePath: string,
    options: ThumbnailOptions = {},
  ): Promise<ThumbnailData> {
    const opts = { ...this.defaultOptions, ...options };

    this.logger.log(
      `Resim thumbnail oluşturuluyor: ${opts.width}x${opts.height}`,
      'ThumbnailService',
    );

    const buffer = await sharp(filePath)
      .resize(opts.width, opts.height, {
        fit: opts.fit,
        position: 'centre',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .jpeg({
        quality: opts.quality,
        mozjpeg: true,
      })
      .toBuffer();

    return {
      buffer,
      width: opts.width,
      height: opts.height,
    };
  }

  /**
   * Videodan thumbnail oluştur
   *
   * Video'nun belirli bir frame'ini alır.
   */
  async createFromVideo(
    filePath: string,
    options: VideoThumbnailOptions = {},
  ): Promise<ThumbnailData> {
    const opts = { ...this.defaultOptions, ...options };
    const timestamp = opts.timestamp || this.configService.get<string>(
      'upload.video.thumbnailTime',
    );

    this.logger.log(
      `Video thumbnail oluşturuluyor: ${timestamp}`,
      'ThumbnailService',
    );

    // Geçici dosya yolu
    const tempThumbPath = path.join(
      this.tempDir,
      `thumb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`,
    );

    return new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .screenshots({
          timestamps: [timestamp],
          filename: path.basename(tempThumbPath),
          folder: this.tempDir,
          size: `${opts.width}x${opts.height}`,
        })
        .on('end', async () => {
          try {
            // Sharp ile optimize et
            const buffer = await sharp(tempThumbPath)
              .resize(opts.width, opts.height, {
                fit: opts.fit,
                position: 'centre',
              })
              .jpeg({
                quality: opts.quality,
                mozjpeg: true,
              })
              .toBuffer();

            // Geçici dosyayı sil
            await fs.unlink(tempThumbPath);

            resolve({
              buffer,
              width: opts.width,
              height: opts.height,
            });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (err) => {
          this.logger.error(
            `Video thumbnail hatası: ${err.message}`,
            'ThumbnailService',
          );
          reject(err);
        });
    });
  }

  /**
   * Farklı boyutlarda thumbnail set'i oluştur
   */
  async createThumbnailSet(
    filePath: string,
    sizes: Array<{ name: string; width: number; height: number }>,
  ): Promise<Map<string, ThumbnailData>> {
    const thumbnails = new Map<string, ThumbnailData>();

    for (const size of sizes) {
      const thumbnail = await this.createFromImage(filePath, {
        width: size.width,
        height: size.height,
      });
      thumbnails.set(size.name, thumbnail);
    }

    return thumbnails;
  }

  /**
   * Avatar thumbnail oluştur (kare, yuvarlak kesilecek)
   */
  async createAvatar(
    filePath: string,
    size: number = 200,
  ): Promise<ThumbnailData> {
    const buffer = await sharp(filePath)
      .resize(size, size, {
        fit: 'cover',
        position: 'centre',
      })
      .jpeg({
        quality: 90,
        mozjpeg: true,
      })
      .toBuffer();

    return {
      buffer,
      width: size,
      height: size,
    };
  }

  /**
   * Blur thumbnail oluştur (placeholder için)
   */
  async createBlurPlaceholder(
    filePath: string,
    width: number = 20,
    height: number = 20,
  ): Promise<ThumbnailData> {
    const buffer = await sharp(filePath)
      .resize(width, height, {
        fit: 'inside',
      })
      .blur(5)
      .jpeg({
        quality: 20,
      })
      .toBuffer();

    return {
      buffer,
      width,
      height,
    };
  }
}
