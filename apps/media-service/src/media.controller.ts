/**
 * Media Controller
 *
 * Medya yükleme ve silme endpoint'leri.
 *
 * Endpoints:
 * - POST /media/upload - Tekli/çoklu dosya yükleme
 * - DELETE /media/:id - Medya silme
 * - GET /health - Sağlık kontrolü
 */

import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, CurrentUser } from '@superapp/shared-auth';
import { LoggerService } from '@superapp/shared-logger';
import { MediaService } from './media.service';
import { MediaResponseDto } from './dto/media-response.dto';
import { ApiSuccessResponse, ApiErrorResponse } from '@superapp/shared-types';

// Kullanıcı tipi (JWT'den gelen)
interface JwtPayload {
  userId: string;
  email: string;
}

@Controller('media')
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Tekli Dosya Yükleme
   *
   * POST /media/upload
   * Content-Type: multipart/form-data
   *
   * Form Fields:
   * - file: Binary dosya
   * - type: image | video | voice (opsiyonel, otomatik algılanır)
   */
  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiSuccessResponse<MediaResponseDto>> {
    // Dosya kontrolü
    if (!file) {
      throw new BadRequestException('Dosya gerekli');
    }

    this.logger.log(
      `Dosya yükleniyor: ${file.originalname} (${file.size} bytes)`,
      'MediaController',
    );

    // Yükleme işlemi
    const media = await this.mediaService.processAndUpload(file, user.userId);

    return {
      success: true,
      data: media,
    };
  }

  /**
   * Çoklu Dosya Yükleme
   *
   * POST /media/upload/multiple
   * Content-Type: multipart/form-data
   *
   * Form Fields:
   * - files: Binary dosyalar (max 10)
   */
  @Post('upload/multiple')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10))
  @HttpCode(HttpStatus.CREATED)
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiSuccessResponse<MediaResponseDto[]>> {
    // Dosya kontrolü
    if (!files || files.length === 0) {
      throw new BadRequestException('En az bir dosya gerekli');
    }

    this.logger.log(
      `${files.length} dosya yükleniyor`,
      'MediaController',
    );

    // Paralel yükleme
    const mediaPromises = files.map((file) =>
      this.mediaService.processAndUpload(file, user.userId),
    );

    const mediaList = await Promise.all(mediaPromises);

    return {
      success: true,
      data: mediaList,
    };
  }

  /**
   * Medya Silme
   *
   * DELETE /media/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id') mediaId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiSuccessResponse<null>> {
    this.logger.log(
      `Medya siliniyor: ${mediaId}`,
      'MediaController',
    );

    await this.mediaService.delete(mediaId, user.userId);

    return {
      success: true,
      data: null,
    };
  }

  /**
   * Health Check
   *
   * GET /health
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
