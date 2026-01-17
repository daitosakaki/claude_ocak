/**
 * Image Service
 *
 * Resim işleme servisi.
 * Sharp kütüphanesi kullanılır.
 *
 * Özellikler:
 * - Resize
 * - Sıkıştırma
 * - Format dönüşümü
 * - Blurhash hesaplama
 * - EXIF işleme
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@superapp/shared-logger';
import * as sharp from 'sharp';
import { encode } from 'blurhash';
import { ProcessedImage } from '../dto/media-response.dto';

export interface ImageProcessOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | null;
  preserveExif?: boolean;
  autoRotate?: boolean;
}

@Injectable()
export class ImageService {
  private readonly defaultOptions: ImageProcessOptions;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.defaultOptions = {
      maxWidth: this.configService.get<number>('upload.image.maxWidth'),
      maxHeight: this.configService.get<number>('upload.image.maxHeight'),
      quality: this.configService.get<number>('upload.image.quality'),
      format: this.configService.get<string>('upload.image.outputFormat') as any,
      preserveExif: this.configService.get<boolean>('upload.image.preserveExif'),
      autoRotate: this.configService.get<boolean>('upload.image.autoRotate'),
    };
  }

  /**
   * Resmi işle
   *
   * 1. Metadata oku
   * 2. Otomatik döndür (EXIF)
   * 3. Resize (max boyutlara göre)
   * 4. Format dönüşümü (opsiyonel)
   * 5. Sıkıştır
   */
  async process(
    filePath: string,
    options: ImageProcessOptions = {},
  ): Promise<ProcessedImage> {
    const opts = { ...this.defaultOptions, ...options };

    this.logger.log(`Resim işleniyor: ${filePath}`, 'ImageService');

    // Sharp instance oluştur
    let pipeline = sharp(filePath);

    // Metadata oku
    const metadata = await pipeline.metadata();
    const originalFormat = metadata.format;

    // Otomatik döndür (EXIF orientation)
    if (opts.autoRotate) {
      pipeline = pipeline.rotate();
    }

    // Resize (en-boy oranını koru)
    const shouldResize =
      (opts.maxWidth && metadata.width > opts.maxWidth) ||
      (opts.maxHeight && metadata.height > opts.maxHeight);

    if (shouldResize) {
      pipeline = pipeline.resize(opts.maxWidth, opts.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Format ve sıkıştırma
    const outputFormat = opts.format || originalFormat;

    switch (outputFormat) {
      case 'jpeg':
        pipeline = pipeline.jpeg({
          quality: opts.quality,
          mozjpeg: true, // Daha iyi sıkıştırma
        });
        break;

      case 'png':
        pipeline = pipeline.png({
          quality: opts.quality,
          compressionLevel: 9,
        });
        break;

      case 'webp':
        pipeline = pipeline.webp({
          quality: opts.quality,
        });
        break;

      default:
        // Orijinal format
        pipeline = pipeline.toFormat(originalFormat as any, {
          quality: opts.quality,
        });
    }

    // EXIF metadata kaldır (privacy)
    if (!opts.preserveExif) {
      pipeline = pipeline.withMetadata({
        exif: {},
      });
    }

    // İşle
    const buffer = await pipeline.toBuffer({ resolveWithObject: true });

    // Yeni boyutları al
    const processedMetadata = await sharp(buffer.data).metadata();

    return {
      buffer: buffer.data,
      format: outputFormat || originalFormat,
      mimeType: this.getMimeType(outputFormat || originalFormat),
      width: processedMetadata.width,
      height: processedMetadata.height,
      size: buffer.info.size,
    };
  }

  /**
   * Blurhash hesapla
   *
   * Blurhash, resmin düşük çözünürlüklü bir "parmak izi"dir.
   * Yükleme sırasında placeholder olarak kullanılır.
   */
  async generateBlurhash(filePath: string): Promise<string> {
    const componentX = this.configService.get<number>('upload.blurhash.componentX');
    const componentY = this.configService.get<number>('upload.blurhash.componentY');

    // Küçük bir versiyon oluştur (performans için)
    const { data, info } = await sharp(filePath)
      .resize(32, 32, { fit: 'inside' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Blurhash hesapla
    const blurhash = encode(
      new Uint8ClampedArray(data),
      info.width,
      info.height,
      componentX,
      componentY,
    );

    return blurhash;
  }

  /**
   * Resim boyutlarını al
   */
  async getDimensions(filePath: string): Promise<{ width: number; height: number }> {
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
    };
  }

  /**
   * Resmi crop et
   */
  async crop(
    filePath: string,
    options: {
      left: number;
      top: number;
      width: number;
      height: number;
    },
  ): Promise<Buffer> {
    return sharp(filePath)
      .extract(options)
      .toBuffer();
  }

  /**
   * Resmi döndür
   */
  async rotate(filePath: string, angle: number): Promise<Buffer> {
    return sharp(filePath)
      .rotate(angle)
      .toBuffer();
  }

  /**
   * Resmi aynala
   */
  async flip(filePath: string, horizontal: boolean = false): Promise<Buffer> {
    let pipeline = sharp(filePath);

    if (horizontal) {
      pipeline = pipeline.flop();
    } else {
      pipeline = pipeline.flip();
    }

    return pipeline.toBuffer();
  }

  /**
   * Format'tan MIME type belirle
   */
  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      heic: 'image/heic',
      heif: 'image/heif',
      avif: 'image/avif',
    };

    return mimeTypes[format] || 'application/octet-stream';
  }
}
