import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

// Kullanıcı arama sorgusu
export class UserQueryDto {
  @ApiProperty({
    description: 'Arama sorgusu',
    example: 'john',
  })
  @IsString()
  @IsNotEmpty({ message: 'Arama sorgusu boş olamaz' })
  q: string;

  @ApiPropertyOptional({
    description: 'Sonuç limiti',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}

// Takipçi/Takip edilen listesi sorgusu
export class FollowersQueryDto {
  @ApiPropertyOptional({
    description: 'Sayfalama cursor',
    example: 'eyJpZCI6IjEyMyJ9',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Sonuç limiti',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}

// Pagination bilgisi
export class PaginationDto {
  @ApiProperty({ example: true })
  hasMore: boolean;

  @ApiPropertyOptional({ example: 'eyJpZCI6IjEyMyJ9' })
  nextCursor?: string;
}

// Paginated response wrapper
export class PaginatedResponseDto<T> {
  data: T[];
  pagination: PaginationDto;
}
