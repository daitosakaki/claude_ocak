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
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@superapp/shared-auth';
import { UserService } from './user.service';
import { ProfileService } from './services/profile.service';
import { SettingsService } from './services/settings.service';
import { FollowService } from './services/follow.service';
import { BlockService } from './services/block.service';
import { KeysService } from './services/keys.service';

// DTOs
import {
  UpdateProfileDto,
  UpdateSettingsDto,
  UserResponseDto,
  UserQueryDto,
  FollowersQueryDto,
  CreateKeyDto,
} from './dto';

// Types
import { JwtPayload } from '@superapp/shared-types';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly profileService: ProfileService,
    private readonly settingsService: SettingsService,
    private readonly followService: FollowService,
    private readonly blockService: BlockService,
    private readonly keysService: KeysService,
  ) {}

  // ==================== PROFILE ====================

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mevcut kullanıcı bilgilerini getir' })
  @ApiResponse({ status: 200, description: 'Kullanıcı bilgileri', type: UserResponseDto })
  async getCurrentUser(@CurrentUser() user: JwtPayload) {
    const userData = await this.profileService.getById(user.userId);
    return {
      success: true,
      data: userData,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ID ile kullanıcı getir' })
  @ApiParam({ name: 'id', description: 'Kullanıcı ID' })
  @ApiResponse({ status: 200, description: 'Kullanıcı bilgileri', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Kullanıcı bulunamadı' })
  async getUserById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const userData = await this.profileService.getById(id, user.userId);
    return {
      success: true,
      data: userData,
    };
  }

  @Get('username/:username')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kullanıcı adı ile kullanıcı getir' })
  @ApiParam({ name: 'username', description: 'Kullanıcı adı' })
  @ApiResponse({ status: 200, description: 'Kullanıcı bilgileri', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Kullanıcı bulunamadı' })
  async getUserByUsername(
    @Param('username') username: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const userData = await this.profileService.getByUsername(username, user.userId);
    return {
      success: true,
      data: userData,
    };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil güncelle' })
  @ApiResponse({ status: 200, description: 'Güncellenmiş profil', type: UserResponseDto })
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const userData = await this.profileService.update(user.userId, updateProfileDto);
    return {
      success: true,
      data: userData,
    };
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kullanıcı ara' })
  @ApiQuery({ name: 'q', description: 'Arama sorgusu' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit' })
  @ApiResponse({ status: 200, description: 'Arama sonuçları' })
  async searchUsers(@Query() query: UserQueryDto, @CurrentUser() user: JwtPayload) {
    const users = await this.userService.search(query.q, query.limit, user.userId);
    return {
      success: true,
      data: users,
    };
  }

  // ==================== SETTINGS ====================

  @Get('me/settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kullanıcı ayarlarını getir' })
  @ApiResponse({ status: 200, description: 'Kullanıcı ayarları' })
  async getSettings(@CurrentUser() user: JwtPayload) {
    const settings = await this.settingsService.get(user.userId);
    return {
      success: true,
      data: settings,
    };
  }

  @Patch('me/settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kullanıcı ayarlarını güncelle' })
  @ApiResponse({ status: 200, description: 'Güncellenmiş ayarlar' })
  async updateSettings(
    @CurrentUser() user: JwtPayload,
    @Body() updateSettingsDto: UpdateSettingsDto,
  ) {
    const settings = await this.settingsService.update(user.userId, updateSettingsDto);
    return {
      success: true,
      data: settings,
    };
  }

  // ==================== FOLLOW ====================

  @Get(':id/followers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Takipçileri getir' })
  @ApiParam({ name: 'id', description: 'Kullanıcı ID' })
  @ApiResponse({ status: 200, description: 'Takipçi listesi' })
  async getFollowers(
    @Param('id') id: string,
    @Query() query: FollowersQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const result = await this.followService.getFollowers(id, query, user.userId);
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Get(':id/following')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Takip edilenleri getir' })
  @ApiParam({ name: 'id', description: 'Kullanıcı ID' })
  @ApiResponse({ status: 200, description: 'Takip edilen listesi' })
  async getFollowing(
    @Param('id') id: string,
    @Query() query: FollowersQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const result = await this.followService.getFollowing(id, query, user.userId);
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kullanıcıyı takip et' })
  @ApiParam({ name: 'id', description: 'Takip edilecek kullanıcı ID' })
  @ApiResponse({ status: 200, description: 'Takip başarılı' })
  async followUser(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const result = await this.followService.follow(user.userId, id);
    return {
      success: true,
      data: result,
    };
  }

  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Takibi bırak' })
  @ApiParam({ name: 'id', description: 'Takipten çıkılacak kullanıcı ID' })
  @ApiResponse({ status: 200, description: 'Takip bırakıldı' })
  async unfollowUser(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.followService.unfollow(user.userId, id);
    return {
      success: true,
    };
  }

  // ==================== BLOCK ====================

  @Get('blocked')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Engellenen kullanıcıları getir' })
  @ApiResponse({ status: 200, description: 'Engellenen kullanıcı listesi' })
  async getBlockedUsers(@CurrentUser() user: JwtPayload) {
    const blockedUsers = await this.blockService.getBlockedUsers(user.userId);
    return {
      success: true,
      data: blockedUsers,
    };
  }

  @Post(':id/block')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kullanıcıyı engelle' })
  @ApiParam({ name: 'id', description: 'Engellenecek kullanıcı ID' })
  @ApiResponse({ status: 200, description: 'Engelleme başarılı' })
  async blockUser(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.blockService.block(user.userId, id);
    return {
      success: true,
    };
  }

  @Delete(':id/block')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Engeli kaldır' })
  @ApiParam({ name: 'id', description: 'Engeli kaldırılacak kullanıcı ID' })
  @ApiResponse({ status: 200, description: 'Engel kaldırıldı' })
  async unblockUser(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.blockService.unblock(user.userId, id);
    return {
      success: true,
    };
  }

  // ==================== KEYS (E2EE) ====================

  @Post('me/keys')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Public key yükle/güncelle' })
  @ApiResponse({ status: 201, description: 'Key oluşturuldu' })
  async uploadKey(@CurrentUser() user: JwtPayload, @Body() createKeyDto: CreateKeyDto) {
    const key = await this.keysService.createOrUpdate(user.userId, createKeyDto);
    return {
      success: true,
      data: key,
    };
  }

  @Get(':id/keys')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kullanıcının public keylerini getir' })
  @ApiParam({ name: 'id', description: 'Kullanıcı ID' })
  @ApiResponse({ status: 200, description: 'Public key listesi' })
  async getUserKeys(@Param('id') id: string) {
    const keys = await this.keysService.getByUserId(id);
    return {
      success: true,
      data: keys,
    };
  }

  // ==================== HEALTH ====================

  @Get('health')
  @ApiOperation({ summary: 'Servis sağlık kontrolü' })
  @ApiResponse({ status: 200, description: 'Servis çalışıyor' })
  healthCheck() {
    return {
      status: 'ok',
      service: 'user-service',
      timestamp: new Date().toISOString(),
    };
  }
}
