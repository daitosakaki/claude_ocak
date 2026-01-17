/**
 * Media Service
 *
 * Medya işleme ana orkestrasyon servisi.
 * Diğer servisleri koordine eder.
 */

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@superapp/shared-logger';
import { UploadService } from './services/upload.service';
import { ImageService } from './services/image.service';
import { VideoService } from './services/video.service';
import { ThumbnailService } from './services/thumbnail.service';
import { StorageService } from './services/storage.service';
import { MediaPublisher } from './events/media.publisher';
import { MediaResponseDto, MediaType } from './dto/media-response.dto';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class MediaService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly uploadService: UploadService,
    private readonly imageService: ImageService,
    private readonly videoService: VideoService,
    private readonly thumbnailService: ThumbnailService,
    private readonly storageService: StorageService,
    private readonly mediaPublisher: MediaPublisher,
  ) {}

  /**
   * Dosyayı işle ve yükle
   *
   * 1. Dosya tipini belirle
   * 2. Tip'e göre işle (resize, transcode, thumbnail)
   * 3. Cloud Storage'a yükle
   * 4. Event publish et
   */
  async processAndUpload(
    file: Express.Multer.File,
    userId: string,
  ): Promise<MediaResponseDto> {
    const mediaId = uuidv4();
    const mediaType = this.detectMediaType(file.mimetype);

    this.logger.log(
      `İşleniyor: ${file.originalname} (${mediaType})`,
      'MediaService',
    );

    try {
      let result: MediaResponseDto;

      switch (mediaType) {
        case MediaType.IMAGE:
          result = await this.processImage(file, mediaId, userId);
          break;

        case MediaType.VIDEO:
          result = await this.processVideo(file, mediaId, userId);
          break;

        case MediaType.VOICE:
          result = await this.processVoice(file, mediaId, userId);
          break;

        default:
          throw new BadRequestException('Desteklenmeyen medya tipi');
      }

      // Event publish et
      await this.mediaPublisher.publishMediaProcessed({
        mediaId: result.id,
        userId,
        type: result.type,
        url: result.url,
      });

      return result;
    } catch (error) {
      // Hata durumunda event publish et
      await this.mediaPublisher.publishMediaFailed({
        mediaId,
        userId,
        error: error.message,
      });

      throw error;
    } finally {
      // Geçici dosyayı temizle
      await this.cleanupTempFile(file.path);
    }
  }

  /**
   * Resim İşleme
   *
   * 1. Resize (max 2048px)
   * 2. Sıkıştırma (quality 85%)
   * 3. Thumbnail oluşturma
   * 4. Blurhash hesaplama
   * 5. WebP dönüşümü (opsiyonel)
   */
  private async processImage(
    file: Express.Multer.File,
    mediaId: string,
    userId: string,
  ): Promise<MediaResponseDto> {
    // Resmi işle
    const processedImage = await this.imageService.process(file.path, {
      maxWidth: 2048,
      maxHeight: 2048,
      quality: 85,
    });

    // Thumbnail oluştur
    const thumbnail = await this.thumbnailService.createFromImage(
      file.path,
      {
        width: 300,
        height: 300,
      },
    );

    // Blurhash hesapla
    const blurhash = await this.imageService.generateBlurhash(file.path);

    // Cloud Storage'a yükle
    const uploadPath = `media/${userId}/${mediaId}`;

    const mainUrl = await this.storageService.upload(
      processedImage.buffer,
      `${uploadPath}/main.${processedImage.format}`,
      processedImage.mimeType,
    );

    const thumbnailUrl = await this.storageService.upload(
      thumbnail.buffer,
      `${uploadPath}/thumb.jpg`,
      'image/jpeg',
    );

    return {
      id: mediaId,
      url: mainUrl,
      thumbnailUrl,
      type: MediaType.IMAGE,
      mimeType: processedImage.mimeType,
      size: processedImage.size,
      width: processedImage.width,
      height: processedImage.height,
      blurhash,
    };
  }

  /**
   * Video İşleme
   *
   * 1. Metadata çıkarma
   * 2. Transcoding (H.264, max 1080p)
   * 3. Thumbnail oluşturma (video'dan frame)
   */
  private async processVideo(
    file: Express.Multer.File,
    mediaId: string,
    userId: string,
  ): Promise<MediaResponseDto> {
    // Video metadata'sını al
    const metadata = await this.videoService.getMetadata(file.path);

    // Video'yu transcode et
    const processedVideo = await this.videoService.transcode(file.path, {
      maxWidth: 1920,
      maxHeight: 1080,
      videoBitrate: '2500k',
      audioBitrate: '128k',
    });

    // Video'dan thumbnail oluştur
    const thumbnail = await this.thumbnailService.createFromVideo(
      file.path,
      {
        width: 300,
        height: 300,
        timestamp: '00:00:01', // 1. saniye
      },
    );

    // Cloud Storage'a yükle
    const uploadPath = `media/${userId}/${mediaId}`;

    const mainUrl = await this.storageService.upload(
      processedVideo.buffer,
      `${uploadPath}/main.mp4`,
      'video/mp4',
    );

    const thumbnailUrl = await this.storageService.upload(
      thumbnail.buffer,
      `${uploadPath}/thumb.jpg`,
      'image/jpeg',
    );

    return {
      id: mediaId,
      url: mainUrl,
      thumbnailUrl,
      type: MediaType.VIDEO,
      mimeType: 'video/mp4',
      size: processedVideo.size,
      width: processedVideo.width,
      height: processedVideo.height,
      duration: metadata.duration,
    };
  }

  /**
   * Ses İşleme
   *
   * 1. Metadata çıkarma
   * 2. AAC'ye dönüştürme (gerekirse)
   */
  private async processVoice(
    file: Express.Multer.File,
    mediaId: string,
    userId: string,
  ): Promise<MediaResponseDto> {
    // Ses dosyasını işle
    const processedAudio = await this.videoService.processAudio(file.path, {
      audioBitrate: '128k',
      format: 'aac',
    });

    // Cloud Storage'a yükle
    const uploadPath = `media/${userId}/${mediaId}`;

    const mainUrl = await this.storageService.upload(
      processedAudio.buffer,
      `${uploadPath}/main.aac`,
      'audio/aac',
    );

    return {
      id: mediaId,
      url: mainUrl,
      type: MediaType.VOICE,
      mimeType: 'audio/aac',
      size: processedAudio.size,
      duration: processedAudio.duration,
    };
  }

  /**
   * Medya Silme
   */
  async delete(mediaId: string, userId: string): Promise<void> {
    const mediaPath = `media/${userId}/${mediaId}`;

    try {
      // Klasördeki tüm dosyaları sil
      await this.storageService.deleteFolder(mediaPath);

      this.logger.log(
        `Medya silindi: ${mediaId}`,
        'MediaService',
      );
    } catch (error) {
      if (error.code === 404) {
        throw new NotFoundException('Medya bulunamadı');
      }
      throw error;
    }
  }

  /**
   * Medya tipini MIME type'dan belirle
   */
  private detectMediaType(mimeType: string): MediaType {
    if (mimeType.startsWith('image/')) {
      return MediaType.IMAGE;
    }
    if (mimeType.startsWith('video/')) {
      return MediaType.VIDEO;
    }
    if (mimeType.startsWith('audio/')) {
      return MediaType.VOICE;
    }
    throw new BadRequestException(`Desteklenmeyen MIME type: ${mimeType}`);
  }

  /**
   * Geçici dosyayı temizle
   */
  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      this.logger.warn(
        `Geçici dosya silinemedi: ${filePath}`,
        'MediaService',
      );
    }
  }
}
