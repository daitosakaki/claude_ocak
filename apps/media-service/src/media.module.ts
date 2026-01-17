/**
 * Media Module
 *
 * Medya işleme ile ilgili tüm bileşenleri içerir:
 * - Controller: HTTP endpoint'leri
 * - Services: İş mantığı
 * - Processors: Arka plan işleme
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { UploadService } from './services/upload.service';
import { ImageService } from './services/image.service';
import { VideoService } from './services/video.service';
import { ThumbnailService } from './services/thumbnail.service';
import { StorageService } from './services/storage.service';
import { ImageProcessor } from './processors/image.processor';
import { VideoProcessor } from './processors/video.processor';
import { MediaPublisher } from './events/media.publisher';

@Module({
  imports: [
    ConfigModule,

    // Multer - Dosya yükleme
    MulterModule.registerAsync({
      useFactory: () => ({
        storage: diskStorage({
          destination: '/tmp/uploads',
          filename: (req, file, cb) => {
            // Benzersiz dosya adı oluştur
            const uniqueId = uuidv4();
            const ext = path.extname(file.originalname);
            cb(null, `${uniqueId}${ext}`);
          },
        }),
        limits: {
          fileSize: 100 * 1024 * 1024, // 100MB max
          files: 10, // Tek seferde max 10 dosya
        },
        fileFilter: (req, file, cb) => {
          // İzin verilen MIME tipleri
          const allowedMimeTypes = [
            // Images
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/heic',
            'image/heif',
            // Videos
            'video/mp4',
            'video/quicktime',
            'video/x-msvideo',
            'video/x-matroska',
            'video/webm',
            // Voice
            'audio/mpeg',
            'audio/mp4',
            'audio/ogg',
            'audio/webm',
            'audio/wav',
          ];

          if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(new Error(`Desteklenmeyen dosya tipi: ${file.mimetype}`), false);
          }
        },
      }),
    }),
  ],
  controllers: [MediaController],
  providers: [
    // Ana servis
    MediaService,

    // Alt servisler
    UploadService,
    ImageService,
    VideoService,
    ThumbnailService,
    StorageService,

    // İşlemciler
    ImageProcessor,
    VideoProcessor,

    // Event publisher
    MediaPublisher,
  ],
  exports: [MediaService, StorageService],
})
export class MediaModule {}
