/**
 * Video Service
 *
 * Video ve ses işleme servisi.
 * FFmpeg kütüphanesi kullanılır.
 *
 * Özellikler:
 * - Video transcoding
 * - Ses dönüştürme
 * - Metadata çıkarma
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@superapp/shared-logger';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  ProcessedVideo,
  ProcessedAudio,
  VideoMetadata,
} from '../dto/media-response.dto';

export interface VideoTranscodeOptions {
  maxWidth?: number;
  maxHeight?: number;
  videoBitrate?: string;
  audioBitrate?: string;
  videoCodec?: string;
  audioCodec?: string;
  preset?: string;
  crf?: number;
}

export interface AudioProcessOptions {
  audioBitrate?: string;
  sampleRate?: number;
  channels?: number;
  format?: string;
}

@Injectable()
export class VideoService {
  private readonly tempDir: string;
  private readonly maxDuration: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.tempDir = this.configService.get<string>('app.tempDir');
    this.maxDuration = this.configService.get<number>('upload.video.maxDuration');
  }

  /**
   * Video metadata'sını al
   */
  async getMetadata(filePath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(new BadRequestException('Video metadata okunamadı'));
          return;
        }

        const videoStream = metadata.streams.find((s) => s.codec_type === 'video');

        if (!videoStream) {
          reject(new BadRequestException('Video stream bulunamadı'));
          return;
        }

        // Süre kontrolü
        const duration = parseFloat(metadata.format.duration);
        if (duration > this.maxDuration) {
          reject(
            new BadRequestException(
              `Video süresi çok uzun. Maksimum: ${this.maxDuration} saniye`,
            ),
          );
          return;
        }

        resolve({
          width: videoStream.width,
          height: videoStream.height,
          duration,
          bitrate: parseInt(metadata.format.bit_rate, 10) || 0,
          codec: videoStream.codec_name,
          fps: this.parseFps(videoStream.r_frame_rate),
        });
      });
    });
  }

  /**
   * Video transcode et
   */
  async transcode(
    filePath: string,
    options: VideoTranscodeOptions = {},
  ): Promise<ProcessedVideo> {
    const config = this.configService.get('upload.video');
    const opts = {
      maxWidth: options.maxWidth || config.maxWidth,
      maxHeight: options.maxHeight || config.maxHeight,
      videoBitrate: options.videoBitrate || config.videoBitrate,
      audioBitrate: options.audioBitrate || config.audioBitrate,
      videoCodec: options.videoCodec || config.videoCodec,
      audioCodec: options.audioCodec || config.audioCodec,
      preset: options.preset || config.preset,
      crf: options.crf || config.crf,
    };

    // Metadata al
    const metadata = await this.getMetadata(filePath);

    // Çıktı boyutlarını hesapla (en-boy oranını koru)
    const { width, height } = this.calculateDimensions(
      metadata.width,
      metadata.height,
      opts.maxWidth,
      opts.maxHeight,
    );

    // Çıktı dosyası
    const outputPath = path.join(
      this.tempDir,
      `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp4`,
    );

    this.logger.log(
      `Video transcode başlıyor: ${metadata.width}x${metadata.height} -> ${width}x${height}`,
      'VideoService',
    );

    return new Promise((resolve, reject) => {
      ffmpeg(filePath)
        // Video ayarları
        .videoCodec(opts.videoCodec)
        .size(`${width}x${height}`)
        .videoBitrate(opts.videoBitrate)
        .outputOptions([
          `-preset ${opts.preset}`,
          `-crf ${opts.crf}`,
          '-movflags +faststart', // Web için optimize
          '-pix_fmt yuv420p', // Uyumluluk
        ])
        // Ses ayarları
        .audioCodec(opts.audioCodec)
        .audioBitrate(opts.audioBitrate)
        // Çıktı
        .output(outputPath)
        .on('start', (cmd) => {
          this.logger.log(`FFmpeg komutu: ${cmd}`, 'VideoService');
        })
        .on('progress', (progress) => {
          this.logger.log(
            `İşleniyor: ${Math.round(progress.percent || 0)}%`,
            'VideoService',
          );
        })
        .on('end', async () => {
          try {
            const buffer = await fs.readFile(outputPath);
            const stats = await fs.stat(outputPath);

            // Geçici dosyayı sil
            await fs.unlink(outputPath);

            resolve({
              buffer,
              format: 'mp4',
              mimeType: 'video/mp4',
              width,
              height,
              size: stats.size,
              duration: metadata.duration,
            });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (err) => {
          this.logger.error(`FFmpeg hatası: ${err.message}`, 'VideoService');
          reject(new BadRequestException('Video işlenemedi'));
        })
        .run();
    });
  }

  /**
   * Ses dosyasını işle
   */
  async processAudio(
    filePath: string,
    options: AudioProcessOptions = {},
  ): Promise<ProcessedAudio> {
    const config = this.configService.get('upload.audio');
    const opts = {
      audioBitrate: options.audioBitrate || config.bitrate,
      sampleRate: options.sampleRate || config.sampleRate,
      channels: options.channels || config.channels,
      format: options.format || config.outputFormat,
    };

    // Metadata al
    const duration = await this.getAudioDuration(filePath);

    // Süre kontrolü
    const maxDuration = this.configService.get<number>('upload.audio.maxDuration');
    if (duration > maxDuration) {
      throw new BadRequestException(
        `Ses süresi çok uzun. Maksimum: ${maxDuration} saniye`,
      );
    }

    // Çıktı dosyası
    const outputPath = path.join(
      this.tempDir,
      `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${opts.format}`,
    );

    return new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .audioCodec('aac')
        .audioBitrate(opts.audioBitrate)
        .audioFrequency(opts.sampleRate)
        .audioChannels(opts.channels)
        .output(outputPath)
        .on('end', async () => {
          try {
            const buffer = await fs.readFile(outputPath);
            const stats = await fs.stat(outputPath);

            // Geçici dosyayı sil
            await fs.unlink(outputPath);

            resolve({
              buffer,
              format: opts.format,
              mimeType: 'audio/aac',
              size: stats.size,
              duration,
            });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (err) => {
          this.logger.error(`FFmpeg hatası: ${err.message}`, 'VideoService');
          reject(new BadRequestException('Ses dosyası işlenemedi'));
        })
        .run();
    });
  }

  /**
   * Ses süresini al
   */
  private async getAudioDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(new BadRequestException('Ses metadata okunamadı'));
          return;
        }
        resolve(parseFloat(metadata.format.duration) || 0);
      });
    });
  }

  /**
   * En-boy oranını koruyarak boyutları hesapla
   */
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
  ): { width: number; height: number } {
    let width = originalWidth;
    let height = originalHeight;

    // Genişlik sınırı
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }

    // Yükseklik sınırı
    if (height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }

    // Çift sayı olmalı (codec uyumluluğu)
    width = Math.floor(width / 2) * 2;
    height = Math.floor(height / 2) * 2;

    return { width, height };
  }

  /**
   * FPS string'ini parse et
   */
  private parseFps(fpsString: string): number {
    if (!fpsString) return 0;

    const parts = fpsString.split('/');
    if (parts.length === 2) {
      return parseInt(parts[0], 10) / parseInt(parts[1], 10);
    }
    return parseFloat(fpsString);
  }
}
