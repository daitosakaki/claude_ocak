import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Kullanıcı özeti (post author bilgisi için)
 */
export class AuthorDto {
  @ApiProperty({ example: 'user_123' })
  id: string;

  @ApiProperty({ example: 'johndoe' })
  username: string;

  @ApiProperty({ example: 'John Doe' })
  displayName: string;

  @ApiPropertyOptional({ example: 'https://cdn.../avatar.jpg' })
  avatar?: string;

  @ApiProperty({ example: false })
  isVerified: boolean;
}

/**
 * Medya bilgisi
 */
export class MediaDto {
  @ApiProperty({ enum: ['image', 'video'], example: 'image' })
  type: 'image' | 'video';

  @ApiProperty({ example: 'https://cdn.../image.jpg' })
  url: string;

  @ApiPropertyOptional({ example: 'https://cdn.../thumb.jpg' })
  thumbnailUrl?: string;

  @ApiPropertyOptional({ example: 1080 })
  width?: number;

  @ApiPropertyOptional({ example: 720 })
  height?: number;

  @ApiPropertyOptional({ example: 30, description: 'Video süresi (saniye)' })
  duration?: number;

  @ApiPropertyOptional({ example: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj' })
  blurhash?: string;
}

/**
 * Anket seçeneği
 */
export class PollOptionDto {
  @ApiProperty({ example: 'opt_1' })
  id: string;

  @ApiProperty({ example: 'Seçenek A' })
  text: string;

  @ApiProperty({ example: 42 })
  votesCount: number;

  @ApiProperty({ example: 35.5 })
  percentage: number;
}

/**
 * Anket bilgisi
 */
export class PollDto {
  @ApiProperty({ example: 'En sevdiğiniz programlama dili?' })
  question: string;

  @ApiProperty({ type: [PollOptionDto] })
  options: PollOptionDto[];

  @ApiProperty({ example: 120 })
  totalVotes: number;

  @ApiProperty({ example: '2024-01-20T00:00:00Z' })
  endsAt: string;

  @ApiPropertyOptional({ example: true })
  hasVoted?: boolean;

  @ApiPropertyOptional({ example: 'opt_2' })
  myVote?: string;
}

/**
 * Post içeriği
 */
export class PostContentDto {
  @ApiPropertyOptional({ example: 'Bu harika bir gönderi! #test @johndoe' })
  text?: string;

  @ApiPropertyOptional({ type: [MediaDto] })
  media?: MediaDto[];

  @ApiPropertyOptional({ type: PollDto })
  poll?: PollDto;
}

/**
 * Post istatistikleri
 */
export class PostStatsDto {
  @ApiProperty({ example: 42 })
  likesCount: number;

  @ApiProperty({ example: 2 })
  dislikesCount: number;

  @ApiProperty({ example: 15 })
  commentsCount: number;

  @ApiProperty({ example: 8 })
  repostsCount: number;

  @ApiProperty({ example: 500 })
  viewsCount: number;

  @ApiProperty({ example: 12 })
  bookmarksCount: number;
}

/**
 * Repost bilgisi
 */
export class RepostInfoDto {
  @ApiProperty({ example: true })
  isRepost: boolean;

  @ApiPropertyOptional({ example: 'post_original_123' })
  originalPostId?: string;

  @ApiPropertyOptional({ type: AuthorDto })
  originalAuthor?: AuthorDto;

  @ApiProperty({ example: false })
  isQuote: boolean;
}

/**
 * Post DTO
 */
export class PostDto {
  @ApiProperty({ example: 'post_123' })
  id: string;

  @ApiProperty({ type: AuthorDto })
  author: AuthorDto;

  @ApiProperty({ enum: ['text', 'image', 'video', 'poll'], example: 'image' })
  type: 'text' | 'image' | 'video' | 'poll';

  @ApiProperty({ type: PostContentDto })
  content: PostContentDto;

  @ApiProperty({ enum: ['public', 'private', 'followers'], example: 'public' })
  visibility: 'public' | 'private' | 'followers';

  @ApiProperty({ type: PostStatsDto })
  stats: PostStatsDto;

  @ApiPropertyOptional({ type: [String], example: ['test', 'hello'] })
  hashtags?: string[];

  @ApiPropertyOptional({ type: RepostInfoDto })
  repost?: RepostInfoDto;

  @ApiProperty({ example: false })
  isPinned: boolean;

  @ApiProperty({ example: false })
  commentsDisabled: boolean;

  // Kullanıcı etkileşimleri
  @ApiProperty({ example: true })
  isLiked: boolean;

  @ApiProperty({ example: false })
  isDisliked: boolean;

  @ApiProperty({ example: false })
  isReposted: boolean;

  @ApiProperty({ example: true })
  isBookmarked: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: string;
}

/**
 * Sayfalama bilgisi
 */
export class PaginationDto {
  @ApiProperty({ example: 100 })
  total?: number;

  @ApiProperty({ example: true })
  hasMore: boolean;

  @ApiPropertyOptional({ example: 'eyJpZCI6IjY1YjEyMzQ1Njc4OTBhYmNkZWYxMjM0NSJ9' })
  nextCursor?: string;
}

/**
 * Feed Response DTO
 */
export class FeedResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [PostDto] })
  data: PostDto[];

  @ApiProperty({ type: PaginationDto })
  pagination: PaginationDto;
}

/**
 * Trending Item DTO
 */
export class TrendingItemDto {
  @ApiProperty({ example: 'teknoloji' })
  tag: string;

  @ApiProperty({ example: 5420 })
  postsCount: number;

  @ApiProperty({ example: 1 })
  rank: number;

  @ApiPropertyOptional({ example: 'technology' })
  category?: string;

  @ApiPropertyOptional({ example: 'Teknoloji haberleri ve tartışmalar' })
  description?: string;
}

/**
 * Trending Response DTO
 */
export class TrendingResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: Object })
  data: {
    hashtags: TrendingItemDto[];
    period: string;
    region: string;
    updatedAt: string;
  };
}

/**
 * Error Response DTO
 */
export class ErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({
    type: Object,
    example: {
      code: 'NOT_FOUND',
      message: 'Kaynak bulunamadı',
    },
  })
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
