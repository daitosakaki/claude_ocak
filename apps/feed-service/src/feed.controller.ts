import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { FeedService } from './feed.service';
import { TrendingService } from './services/trending.service';
import { FeedQueryDto } from './dto/feed-query.dto';
import { TrendingQueryDto } from './dto/trending-query.dto';
import { FeedResponseDto, TrendingResponseDto } from './dto/feed-response.dto';

/**
 * Feed Controller
 * Timeline, Explore ve Trending API endpoint'leri
 */
@ApiTags('feed')
@ApiBearerAuth()
@Controller()
export class FeedController {
  constructor(
    private readonly feedService: FeedService,
    private readonly trendingService: TrendingService,
  ) {}

  /**
   * Home Feed - Takip edilen kullanıcıların gönderileri
   * GET /api/v1/feed/home
   */
  @Get('feed/home')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Home feed getir',
    description: 'Takip edilen kullanıcıların gönderilerini zaman sırasına göre getirir',
  })
  @ApiQuery({ name: 'cursor', required: false, description: 'Sayfalama cursor' })
  @ApiQuery({ name: 'limit', required: false, description: 'Sayfa başına gönderi sayısı (max: 50)' })
  @ApiResponse({
    status: 200,
    description: 'Feed başarıyla getirildi',
    type: FeedResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  async getHomeFeed(
    @Query() query: FeedQueryDto,
  ): Promise<FeedResponseDto> {
    // Not: userId normalde JWT'den alınır, gateway'den header ile gelir
    // Bu implementasyonda X-User-Id header'ından alındığı varsayılıyor
    const userId = 'user_from_header'; // TODO: @CurrentUser() decorator ile alınacak
    
    return this.feedService.getHomeFeed(userId, query);
  }

  /**
   * Explore Feed - Algoritmik/popüler gönderiler
   * GET /api/v1/feed/explore
   */
  @Get('feed/explore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Explore feed getir',
    description: 'Popüler ve önerilen gönderileri getirir',
  })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({
    status: 200,
    description: 'Explore feed başarıyla getirildi',
    type: FeedResponseDto,
  })
  async getExploreFeed(
    @Query() query: FeedQueryDto,
  ): Promise<FeedResponseDto> {
    const userId = 'user_from_header'; // TODO: @CurrentUser() decorator ile alınacak
    
    return this.feedService.getExploreFeed(userId, query);
  }

  /**
   * User Timeline - Belirli kullanıcının gönderileri
   * GET /api/v1/feed/user/:userId
   */
  @Get('feed/user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Kullanıcı timeline getir',
    description: 'Belirli bir kullanıcının gönderilerini getirir',
  })
  @ApiParam({ name: 'userId', description: 'Kullanıcı ID' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({
    status: 200,
    description: 'Timeline başarıyla getirildi',
    type: FeedResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Kullanıcı bulunamadı' })
  async getUserTimeline(
    @Param('userId') targetUserId: string,
    @Query() query: FeedQueryDto,
  ): Promise<FeedResponseDto> {
    const currentUserId = 'user_from_header'; // TODO: @CurrentUser() decorator ile alınacak
    
    return this.feedService.getUserTimeline(targetUserId, currentUserId, query);
  }

  /**
   * Hashtag Feed - Belirli hashtag'e sahip gönderiler
   * GET /api/v1/feed/hashtag/:tag
   */
  @Get('feed/hashtag/:tag')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hashtag feed getir',
    description: 'Belirli bir hashtag ile etiketlenmiş gönderileri getirir',
  })
  @ApiParam({ name: 'tag', description: 'Hashtag (# olmadan)' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({
    status: 200,
    description: 'Hashtag feed başarıyla getirildi',
    type: FeedResponseDto,
  })
  async getHashtagFeed(
    @Param('tag') tag: string,
    @Query() query: FeedQueryDto,
  ): Promise<FeedResponseDto> {
    const userId = 'user_from_header'; // TODO: @CurrentUser() decorator ile alınacak
    
    return this.feedService.getHashtagFeed(tag, userId, query);
  }

  /**
   * Trending Topics - Gündem konuları
   * GET /api/v1/trending
   */
  @Get('trending')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trending konuları getir',
    description: 'Gündem olan hashtag ve konuları getirir',
  })
  @ApiQuery({ name: 'region', required: false, description: 'Bölge kodu (TR, US, vb.)' })
  @ApiQuery({ name: 'period', required: false, description: 'Zaman periyodu (hourly, daily, weekly)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Sonuç sayısı' })
  @ApiResponse({
    status: 200,
    description: 'Trending konular başarıyla getirildi',
    type: TrendingResponseDto,
  })
  async getTrending(
    @Query() query: TrendingQueryDto,
  ): Promise<TrendingResponseDto> {
    return this.trendingService.getTrending(query);
  }

  /**
   * Health Check
   * GET /api/v1/health
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Servis sağlık kontrolü' })
  @ApiResponse({ status: 200, description: 'Servis sağlıklı' })
  healthCheck() {
    return {
      success: true,
      data: {
        service: 'feed-service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
