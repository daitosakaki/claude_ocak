/**
 * Storage Service
 *
 * Google Cloud Storage entegrasyonu.
 *
 * Özellikler:
 * - Dosya yükleme
 * - Dosya silme
 * - Signed URL oluşturma
 * - Klasör silme
 */

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@superapp/shared-logger';
import { Storage, Bucket } from '@google-cloud/storage';

@Injectable()
export class StorageService {
  private readonly storage: Storage;
  private readonly bucket: Bucket;
  private readonly bucketName: string;
  private readonly cdnEnabled: boolean;
  private readonly cdnBaseUrl: string;
  private readonly accessType: string;
  private readonly cacheControl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    // GCS client oluştur
    this.storage = new Storage({
      projectId: this.configService.get<string>('app.gcpProjectId'),
    });

    // Bucket referansı
    this.bucketName = this.configService.get<string>('storage.bucketName');
    this.bucket = this.storage.bucket(this.bucketName);

    // Config değerleri
    this.cdnEnabled = this.configService.get<boolean>('storage.cdnEnabled');
    this.cdnBaseUrl = this.configService.get<string>('storage.cdnBaseUrl');
    this.accessType = this.configService.get<string>('storage.accessType');
    this.cacheControl = this.configService.get<string>('storage.cacheControl');
  }

  /**
   * Dosya yükle
   *
   * @param buffer - Dosya içeriği
   * @param destination - GCS yolu (örn: media/user123/abc/main.jpg)
   * @param contentType - MIME tipi
   * @returns CDN veya GCS URL'i
   */
  async upload(
    buffer: Buffer,
    destination: string,
    contentType: string,
  ): Promise<string> {
    try {
      this.logger.log(`Yükleniyor: ${destination}`, 'StorageService');

      const file = this.bucket.file(destination);

      // Metadata
      const metadata: Record<string, any> = {
        contentType,
        cacheControl: this.cacheControl,
      };

      // Public erişim
      if (this.accessType === 'public') {
        metadata.predefinedAcl = 'publicRead';
      }

      // Yükle
      await file.save(buffer, {
        metadata,
        resumable: false, // Küçük dosyalar için
      });

      // URL oluştur
      const url = this.getPublicUrl(destination);

      this.logger.log(`Yüklendi: ${url}`, 'StorageService');

      return url;
    } catch (error) {
      this.logger.error(
        `Yükleme hatası: ${error.message}`,
        'StorageService',
      );
      throw new InternalServerErrorException('Dosya yüklenemedi');
    }
  }

  /**
   * Dosya sil
   */
  async delete(filePath: string): Promise<void> {
    try {
      this.logger.log(`Siliniyor: ${filePath}`, 'StorageService');

      await this.bucket.file(filePath).delete();

      this.logger.log(`Silindi: ${filePath}`, 'StorageService');
    } catch (error) {
      if (error.code === 404) {
        this.logger.warn(`Dosya bulunamadı: ${filePath}`, 'StorageService');
        return;
      }
      throw error;
    }
  }

  /**
   * Klasördeki tüm dosyaları sil
   */
  async deleteFolder(folderPath: string): Promise<void> {
    try {
      this.logger.log(`Klasör siliniyor: ${folderPath}`, 'StorageService');

      // Klasördeki tüm dosyaları listele
      const [files] = await this.bucket.getFiles({
        prefix: folderPath,
      });

      if (files.length === 0) {
        this.logger.warn(`Klasör boş: ${folderPath}`, 'StorageService');
        return;
      }

      // Tüm dosyaları sil
      await Promise.all(files.map((file) => file.delete()));

      this.logger.log(
        `${files.length} dosya silindi: ${folderPath}`,
        'StorageService',
      );
    } catch (error) {
      this.logger.error(
        `Klasör silme hatası: ${error.message}`,
        'StorageService',
      );
      throw error;
    }
  }

  /**
   * Signed URL oluştur (private dosyalar için)
   */
  async getSignedUrl(
    filePath: string,
    expiresIn?: number,
  ): Promise<string> {
    const expiry = expiresIn || this.configService.get<number>(
      'storage.signedUrlExpiry',
    );

    const [url] = await this.bucket.file(filePath).getSignedUrl({
      action: 'read',
      expires: Date.now() + expiry * 1000,
    });

    return url;
  }

  /**
   * Dosya var mı kontrol et
   */
  async exists(filePath: string): Promise<boolean> {
    const [exists] = await this.bucket.file(filePath).exists();
    return exists;
  }

  /**
   * Dosya metadata'sını al
   */
  async getMetadata(filePath: string): Promise<{
    size: number;
    contentType: string;
    created: Date;
    updated: Date;
  }> {
    const [metadata] = await this.bucket.file(filePath).getMetadata();

    return {
      size: parseInt(metadata.size as string, 10),
      contentType: metadata.contentType,
      created: new Date(metadata.timeCreated),
      updated: new Date(metadata.updated),
    };
  }

  /**
   * Dosyayı kopyala
   */
  async copy(sourcePath: string, destinationPath: string): Promise<string> {
    await this.bucket.file(sourcePath).copy(this.bucket.file(destinationPath));
    return this.getPublicUrl(destinationPath);
  }

  /**
   * Dosyayı taşı
   */
  async move(sourcePath: string, destinationPath: string): Promise<string> {
    await this.bucket.file(sourcePath).move(destinationPath);
    return this.getPublicUrl(destinationPath);
  }

  /**
   * Public URL oluştur
   */
  private getPublicUrl(filePath: string): string {
    if (this.cdnEnabled && this.cdnBaseUrl) {
      return `${this.cdnBaseUrl}/${filePath}`;
    }

    return `https://storage.googleapis.com/${this.bucketName}/${filePath}`;
  }
}
