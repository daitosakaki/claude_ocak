import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { DatingService } from './dating.service';
import { ProfileService } from './services/profile.service';
import { DiscoverService } from './services/discover.service';
import { SwipeService } from './services/swipe.service';
import { MatchService } from './services/match.service';
import { BoostService } from './services/boost.service';
import {
  CreateDatingProfileDto,
  UpdateDatingProfileDto,
} from './dto/dating-profile.dto';
import { SwipeDto } from './dto/swipe.dto';
import { DiscoverQueryDto } from './dto/discover-query.dto';
import { MatchResponseDto, SwipeResponseDto } from './dto/match-response.dto';
// import { JwtAuthGuard } from '@superapp/shared-auth';
// import { CurrentUser } from '@superapp/shared-auth';

/**
 * Dating Controller
 * Flört modülü için tüm endpoint'leri yönetir
 */
@ApiTags('dating')
@ApiBearerAuth()
@Controller('dating')
// @UseGuards(JwtAuthGuard)
export class DatingController {
  constructor(
    private readonly datingService: DatingService,
    private readonly profileService: ProfileService,
    private readonly discoverService: DiscoverService,
    private readonly swipeService: SwipeService,
    private readonly matchService: MatchService,
    private readonly boostService: BoostService,
  ) {}

  // ==================== PROFİL İŞLEMLERİ ====================

  /**
   * Kullanıcının kendi flört profilini getirir
   */
  @Get('profile')
  @ApiOperation({ summary: 'Flört profilini getir' })
  @ApiResponse({ status: 200, description: 'Profil başarıyla getirildi' })
  @ApiResponse({ status: 404, description: 'Profil bulunamadı' })
  async getProfile(/* @CurrentUser() userId: string */) {
    // TODO: Auth guard'dan userId alınacak
    const userId = 'temp_user_id';
    return this.profileService.getProfile(userId);
  }

  /**
   * Yeni flört profili oluşturur
   */
  @Post('profile')
  @ApiOperation({ summary: 'Flört profili oluştur' })
  @ApiResponse({ status: 201, description: 'Profil başarıyla oluşturuldu' })
  @ApiResponse({ status: 409, description: 'Profil zaten mevcut' })
  async createProfile(
    /* @CurrentUser() userId: string, */
    @Body() dto: CreateDatingProfileDto,
  ) {
    const userId = 'temp_user_id';
    return this.profileService.createProfile(userId, dto);
  }

  /**
   * Flört profilini günceller
   */
  @Put('profile')
  @ApiOperation({ summary: 'Flört profilini güncelle' })
  @ApiResponse({ status: 200, description: 'Profil başarıyla güncellendi' })
  @ApiResponse({ status: 404, description: 'Profil bulunamadı' })
  async updateProfile(
    /* @CurrentUser() userId: string, */
    @Body() dto: UpdateDatingProfileDto,
  ) {
    const userId = 'temp_user_id';
    return this.profileService.updateProfile(userId, dto);
  }

  /**
   * Flört profilini siler
   */
  @Delete('profile')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Flört profilini sil' })
  @ApiResponse({ status: 204, description: 'Profil başarıyla silindi' })
  async deleteProfile(/* @CurrentUser() userId: string */) {
    const userId = 'temp_user_id';
    return this.profileService.deleteProfile(userId);
  }

  // ==================== KEŞFİT İŞLEMLERİ ====================

  /**
   * Keşfet ekranı için profilleri getirir
   */
  @Get('discover')
  @ApiOperation({ summary: 'Keşfet - Profilleri getir' })
  @ApiResponse({
    status: 200,
    description: 'Profiller başarıyla getirildi',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getDiscover(
    /* @CurrentUser() userId: string, */
    @Query() query: DiscoverQueryDto,
  ) {
    const userId = 'temp_user_id';
    return this.discoverService.getProfiles(userId, query);
  }

  /**
   * Top Picks - Günün seçilmiş profilleri (Premium)
   */
  @Get('top-picks')
  @ApiOperation({ summary: 'Top Picks - Günün seçilmişleri (Premium)' })
  @ApiResponse({ status: 200, description: 'Top picks getirildi' })
  async getTopPicks(/* @CurrentUser() userId: string */) {
    const userId = 'temp_user_id';
    return this.discoverService.getTopPicks(userId);
  }

  // ==================== SWIPE İŞLEMLERİ ====================

  /**
   * Bir profile swipe yapar (like/pass/superlike)
   */
  @Post('swipe')
  @ApiOperation({ summary: 'Swipe - Beğen/Geç/SuperLike' })
  @ApiResponse({
    status: 200,
    description: 'Swipe başarılı',
    type: SwipeResponseDto,
  })
  async swipe(
    /* @CurrentUser() userId: string, */
    @Body() dto: SwipeDto,
  ): Promise<SwipeResponseDto> {
    const userId = 'temp_user_id';
    return this.swipeService.swipe(userId, dto);
  }

  /**
   * Son swipe'ı geri alır (Rewind - Premium)
   */
  @Post('rewind')
  @ApiOperation({ summary: 'Rewind - Son swipe\'ı geri al (Premium)' })
  @ApiResponse({ status: 200, description: 'Rewind başarılı' })
  async rewind(/* @CurrentUser() userId: string */) {
    const userId = 'temp_user_id';
    return this.swipeService.rewind(userId);
  }

  /**
   * Beni beğenenler listesi (Premium)
   */
  @Get('likes')
  @ApiOperation({ summary: 'Beni beğenenler (Premium)' })
  @ApiResponse({ status: 200, description: 'Beğenenler listesi' })
  async getLikes(
    /* @CurrentUser() userId: string, */
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    const userId = 'temp_user_id';
    return this.swipeService.getLikesReceived(userId, cursor, limit);
  }

  // ==================== EŞLEŞME İŞLEMLERİ ====================

  /**
   * Kullanıcının eşleşmelerini getirir
   */
  @Get('matches')
  @ApiOperation({ summary: 'Eşleşmeleri getir' })
  @ApiResponse({
    status: 200,
    description: 'Eşleşmeler listesi',
    type: [MatchResponseDto],
  })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMatches(
    /* @CurrentUser() userId: string, */
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    const userId = 'temp_user_id';
    return this.matchService.getMatches(userId, cursor, limit);
  }

  /**
   * Eşleşmeyi kaldırır (unmatch)
   */
  @Delete('matches/:matchId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eşleşmeyi kaldır (Unmatch)' })
  @ApiParam({ name: 'matchId', description: 'Eşleşme ID' })
  @ApiResponse({ status: 204, description: 'Eşleşme kaldırıldı' })
  async unmatch(
    /* @CurrentUser() userId: string, */
    @Param('matchId') matchId: string,
  ) {
    const userId = 'temp_user_id';
    return this.matchService.unmatch(userId, matchId);
  }

  // ==================== BOOST İŞLEMLERİ ====================

  /**
   * Profili öne çıkarır (Boost)
   */
  @Post('boost')
  @ApiOperation({ summary: 'Profili öne çıkar (Boost)' })
  @ApiResponse({ status: 200, description: 'Boost aktifleştirildi' })
  async activateBoost(/* @CurrentUser() userId: string */) {
    const userId = 'temp_user_id';
    return this.boostService.activateBoost(userId);
  }

  /**
   * Boost durumunu kontrol eder
   */
  @Get('boost/status')
  @ApiOperation({ summary: 'Boost durumunu kontrol et' })
  @ApiResponse({ status: 200, description: 'Boost durumu' })
  async getBoostStatus(/* @CurrentUser() userId: string */) {
    const userId = 'temp_user_id';
    return this.boostService.getBoostStatus(userId);
  }

  // ==================== HEALTH CHECK ====================

  /**
   * Servis sağlık kontrolü
   */
  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Servis çalışıyor' })
  healthCheck() {
    return {
      status: 'ok',
      service: 'dating-service',
      timestamp: new Date().toISOString(),
    };
  }
}
