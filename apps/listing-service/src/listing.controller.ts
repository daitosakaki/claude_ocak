import {
  Controller,
  Get,
  Post,
  Patch,
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
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ListingService } from './listing.service';
import { CategoryService } from './services/category.service';
import { FavoriteService } from './services/favorite.service';
import { SearchService } from './services/search.service';

// DTOs
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ListingQueryDto } from './dto/listing-query.dto';
import { ListingResponseDto, PaginatedListingResponseDto } from './dto/listing-response.dto';

// Guards & Decorators (shared-auth paketinden)
// import { JwtAuthGuard } from '@superapp/shared-auth';
// import { CurrentUser } from '@superapp/shared-auth';

@ApiTags('listings')
@Controller('listings')
export class ListingController {
  constructor(
    private readonly listingService: ListingService,
    private readonly categoryService: CategoryService,
    private readonly favoriteService: FavoriteService,
    private readonly searchService: SearchService,
  ) {}

  // ==================== İLAN CRUD ====================

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yeni ilan oluştur' })
  @ApiResponse({ status: 201, description: 'İlan başarıyla oluşturuldu', type: ListingResponseDto })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  // @UseGuards(JwtAuthGuard)
  async create(
    @Body() createListingDto: CreateListingDto,
    // @CurrentUser() userId: string,
  ): Promise<ListingResponseDto> {
    const userId = 'temp_user_id'; // TODO: JWT'den alınacak
    return this.listingService.create(createListingDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'İlanları listele (filtreli)' })
  @ApiResponse({ status: 200, description: 'İlan listesi', type: PaginatedListingResponseDto })
  async findAll(@Query() query: ListingQueryDto): Promise<PaginatedListingResponseDto> {
    return this.listingService.findAll(query);
  }

  @Get('search')
  @ApiOperation({ summary: 'İlan ara' })
  @ApiQuery({ name: 'q', description: 'Arama sorgusu', required: true })
  @ApiResponse({ status: 200, description: 'Arama sonuçları', type: PaginatedListingResponseDto })
  async search(
    @Query('q') searchQuery: string,
    @Query() query: ListingQueryDto,
  ): Promise<PaginatedListingResponseDto> {
    return this.searchService.search(searchQuery, query);
  }

  @Get('my-listings')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kendi ilanlarımı getir' })
  @ApiResponse({ status: 200, description: 'Kullanıcının ilanları', type: PaginatedListingResponseDto })
  // @UseGuards(JwtAuthGuard)
  async getMyListings(
    @Query() query: ListingQueryDto,
    // @CurrentUser() userId: string,
  ): Promise<PaginatedListingResponseDto> {
    const userId = 'temp_user_id'; // TODO: JWT'den alınacak
    return this.listingService.findByUser(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'İlan detayı getir' })
  @ApiParam({ name: 'id', description: 'İlan ID' })
  @ApiResponse({ status: 200, description: 'İlan detayı', type: ListingResponseDto })
  @ApiResponse({ status: 404, description: 'İlan bulunamadı' })
  async findOne(@Param('id') id: string): Promise<ListingResponseDto> {
    return this.listingService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'İlanı güncelle' })
  @ApiParam({ name: 'id', description: 'İlan ID' })
  @ApiResponse({ status: 200, description: 'İlan güncellendi', type: ListingResponseDto })
  @ApiResponse({ status: 403, description: 'Yetkiniz yok' })
  @ApiResponse({ status: 404, description: 'İlan bulunamadı' })
  // @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateListingDto: UpdateListingDto,
    // @CurrentUser() userId: string,
  ): Promise<ListingResponseDto> {
    const userId = 'temp_user_id'; // TODO: JWT'den alınacak
    return this.listingService.update(id, updateListingDto, userId);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'İlanı sil' })
  @ApiParam({ name: 'id', description: 'İlan ID' })
  @ApiResponse({ status: 204, description: 'İlan silindi' })
  @ApiResponse({ status: 403, description: 'Yetkiniz yok' })
  @ApiResponse({ status: 404, description: 'İlan bulunamadı' })
  // @UseGuards(JwtAuthGuard)
  async remove(
    @Param('id') id: string,
    // @CurrentUser() userId: string,
  ): Promise<void> {
    const userId = 'temp_user_id'; // TODO: JWT'den alınacak
    await this.listingService.remove(id, userId);
  }

  // ==================== KATEGORİLER ====================

  @Get('categories/all')
  @ApiOperation({ summary: 'Tüm kategorileri getir' })
  @ApiResponse({ status: 200, description: 'Kategori ağacı' })
  async getCategories() {
    return this.categoryService.findAll();
  }

  @Get('categories/:slug')
  @ApiOperation({ summary: 'Kategori detayı' })
  @ApiParam({ name: 'slug', description: 'Kategori slug' })
  @ApiResponse({ status: 200, description: 'Kategori detayı' })
  @ApiResponse({ status: 404, description: 'Kategori bulunamadı' })
  async getCategory(@Param('slug') slug: string) {
    return this.categoryService.findBySlug(slug);
  }

  // ==================== FAVORİLER ====================

  @Post(':id/favorite')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'İlanı favorilere ekle' })
  @ApiParam({ name: 'id', description: 'İlan ID' })
  @ApiResponse({ status: 200, description: 'Favorilere eklendi' })
  @ApiResponse({ status: 404, description: 'İlan bulunamadı' })
  // @UseGuards(JwtAuthGuard)
  async addToFavorites(
    @Param('id') listingId: string,
    // @CurrentUser() userId: string,
  ) {
    const userId = 'temp_user_id'; // TODO: JWT'den alınacak
    return this.favoriteService.add(userId, listingId);
  }

  @Delete(':id/favorite')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'İlanı favorilerden kaldır' })
  @ApiParam({ name: 'id', description: 'İlan ID' })
  @ApiResponse({ status: 204, description: 'Favorilerden kaldırıldı' })
  // @UseGuards(JwtAuthGuard)
  async removeFromFavorites(
    @Param('id') listingId: string,
    // @CurrentUser() userId: string,
  ) {
    const userId = 'temp_user_id'; // TODO: JWT'den alınacak
    await this.favoriteService.remove(userId, listingId);
  }

  @Get('favorites/all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Favorilerim' })
  @ApiResponse({ status: 200, description: 'Favori ilanlar listesi' })
  // @UseGuards(JwtAuthGuard)
  async getFavorites(
    @Query() query: ListingQueryDto,
    // @CurrentUser() userId: string,
  ) {
    const userId = 'temp_user_id'; // TODO: JWT'den alınacak
    return this.favoriteService.getUserFavorites(userId, query);
  }

  // ==================== SATIŞ DURUMU ====================

  @Patch(':id/mark-sold')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'İlanı satıldı olarak işaretle' })
  @ApiParam({ name: 'id', description: 'İlan ID' })
  @ApiResponse({ status: 200, description: 'İlan satıldı olarak işaretlendi' })
  // @UseGuards(JwtAuthGuard)
  async markAsSold(
    @Param('id') id: string,
    // @CurrentUser() userId: string,
  ) {
    const userId = 'temp_user_id'; // TODO: JWT'den alınacak
    return this.listingService.markAsSold(id, userId);
  }

  @Patch(':id/reactivate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'İlanı tekrar aktifleştir' })
  @ApiParam({ name: 'id', description: 'İlan ID' })
  @ApiResponse({ status: 200, description: 'İlan tekrar aktifleştirildi' })
  // @UseGuards(JwtAuthGuard)
  async reactivate(
    @Param('id') id: string,
    // @CurrentUser() userId: string,
  ) {
    const userId = 'temp_user_id'; // TODO: JWT'den alınacak
    return this.listingService.reactivate(id, userId);
  }

  // ==================== HEALTH CHECK ====================

  @Get('health')
  @ApiOperation({ summary: 'Servis sağlık kontrolü' })
  healthCheck() {
    return {
      status: 'ok',
      service: 'listing-service',
      timestamp: new Date().toISOString(),
    };
  }
}
