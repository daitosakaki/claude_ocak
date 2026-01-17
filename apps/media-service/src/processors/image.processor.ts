/**
 * Image Processor
 *
 * Arka planda resim işleme işlerini yönetir.
 * Bu processor, async işler için kullanılabilir (örn: toplu işleme).
 *
 * Not: MVP'de doğrudan işleme yapılır.
 * İleride Bull/BullMQ ile queue sistemi eklenebilir.
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@superapp/shared-logger';
import { ImageService, ImageProcessOptions } from '../services/image.service';
import { ThumbnailService } from '../services/thumbnail.service';
import { StorageService } from '../services/storage.service';
import { ProcessedImage } from '../dto/media-response.dto';

export interface ImageProcessJob {
  jobId: string;
  filePath: string;
  userId: string;
  mediaId: string;
  options?: ImageProcessOptions;
}

export interface ImageProcessResult {
  jobId: string;
  mediaId: string;
  mainUrl: string;
  thumbnailUrl: string;
  blurhash: string;
  width: number;
  height: number;
  size: number;
}

@Injectable()
export class ImageProcessor {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly imageService: ImageService,
    private readonly thumbnailService: ThumbnailService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Resmi işle ve yükle
   */
  async process(job: ImageProcessJob): Promise<ImageProcessResult> {
    this.logger.log(
      `[${job.jobId}] Resim işleniyor: ${job.mediaId}`,
      'ImageProcessor',
    );

    const startTime = Date.now();

    try {
      // 1. Resmi işle (resize, compress)
      const processedImage = await this.imageService.process(
        job.filePath,
        job.options,
      );

      // 2. Thumbnail oluştur
      const thumbnail = await this.thumbnailService.createFromImage(
        job.filePath,
      );

      // 3. Blurhash hesapla
      const blurhash = await this.imageService.generateBlurhash(job.filePath);

      // 4. Cloud Storage'a yükle
      const uploadPath = `media/${job.userId}/${job.mediaId}`;

      const [mainUrl, thumbnailUrl] = await Promise.all([
        this.storageService.upload(
          processedImage.buffer,
          `${uploadPath}/main.${processedImage.format}`,
          processedImage.mimeType,
        ),
        this.storageService.upload(
          thumbnail.buffer,
          `${uploadPath}/thumb.jpg`,
          'image/jpeg',
        ),
      ]);

      const duration = Date.now() - startTime;

      this.logger.log(
        `[${job.jobId}] Resim işlendi: ${duration}ms`,
        'ImageProcessor',
      );

      return {
        jobId: job.jobId,
        mediaId: job.mediaId,
        mainUrl,
        thumbnailUrl,
        blurhash,
        width: processedImage.width,
        height: processedImage.height,
        size: processedImage.size,
      };
    } catch (error) {
      this.logger.error(
        `[${job.jobId}] Resim işleme hatası: ${error.message}`,
        'ImageProcessor',
      );
      throw error;
    }
  }

  /**
   * Toplu resim işleme
   */
  async processBatch(jobs: ImageProcessJob[]): Promise<ImageProcessResult[]> {
    this.logger.log(
      `${jobs.length} resim toplu işleniyor`,
      'ImageProcessor',
    );

    const results = await Promise.allSettled(
      jobs.map((job) => this.process(job)),
    );

    const successful: ImageProcessResult[] = [];
    const failed: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push(jobs[index].jobId);
        this.logger.error(
          `Job başarısız: ${jobs[index].jobId} - ${result.reason}`,
          'ImageProcessor',
        );
      }
    });

    this.logger.log(
      `Toplu işleme tamamlandı: ${successful.length} başarılı, ${failed.length} başarısız`,
      'ImageProcessor',
    );

    return successful;
  }

  /**
   * Avatar işleme (özel format)
   */
  async processAvatar(
    filePath: string,
    userId: string,
  ): Promise<{ url: string; thumbnailUrl: string }> {
    this.logger.log(`Avatar işleniyor: ${userId}`, 'ImageProcessor');

    // Ana avatar (400x400)
    const mainAvatar = await this.thumbnailService.createAvatar(filePath, 400);

    // Küçük avatar (100x100)
    const smallAvatar = await this.thumbnailService.createAvatar(filePath, 100);

    const uploadPath = `avatars/${userId}`;

    const [url, thumbnailUrl] = await Promise.all([
      this.storageService.upload(
        mainAvatar.buffer,
        `${uploadPath}/avatar.jpg`,
        'image/jpeg',
      ),
      this.storageService.upload(
        smallAvatar.buffer,
        `${uploadPath}/avatar-small.jpg`,
        'image/jpeg',
      ),
    ]);

    return { url, thumbnailUrl };
  }

  /**
   * Cover image işleme (özel format)
   */
  async processCoverImage(
    filePath: string,
    userId: string,
  ): Promise<string> {
    this.logger.log(`Cover image işleniyor: ${userId}`, 'ImageProcessor');

    // Cover image boyutu (1500x500)
    const processed = await this.imageService.process(filePath, {
      maxWidth: 1500,
      maxHeight: 500,
      quality: 85,
    });

    const url = await this.storageService.upload(
      processed.buffer,
      `covers/${userId}/cover.jpg`,
      'image/jpeg',
    );

    return url;
  }
}
