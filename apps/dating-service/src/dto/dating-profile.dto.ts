import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Eğitim durumu enum'u
 */
export enum EducationLevel {
  HIGH_SCHOOL = 'high_school',
  BACHELORS = 'bachelors',
  MASTERS = 'masters',
  PHD = 'phd',
  OTHER = 'other',
}

/**
 * Yaşam tarzı seçenekleri
 */
export enum LifestyleOption {
  NEVER = 'never',
  SOMETIMES = 'sometimes',
  REGULARLY = 'regularly',
}

/**
 * Evcil hayvan durumu
 */
export enum PetStatus {
  NONE = 'none',
  CAT = 'cat',
  DOG = 'dog',
  BOTH = 'both',
  OTHER = 'other',
}

/**
 * Çocuk durumu
 */
export enum ChildrenStatus {
  NONE = 'none',
  HAVE = 'have',
  WANT = 'want',
  DONT_WANT = 'dont_want',
}

/**
 * Cinsiyet tercihi
 */
export enum GenderPreference {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

/**
 * Fotoğraf DTO'su
 */
export class PhotoDto {
  @ApiProperty({ description: 'Fotoğraf URL' })
  @IsUrl()
  url: string;

  @ApiProperty({ description: 'Sıralama (0-5)', minimum: 0, maximum: 5 })
  @IsNumber()
  @Min(0)
  @Max(5)
  order: number;

  @ApiPropertyOptional({ description: 'Ana fotoğraf mı?', default: false })
  @IsOptional()
  @IsBoolean()
  isMain?: boolean;
}

/**
 * Prompt (soru-cevap) DTO'su
 */
export class PromptDto {
  @ApiProperty({ description: 'Soru metni' })
  @IsString()
  @MaxLength(100)
  question: string;

  @ApiProperty({ description: 'Cevap metni' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  answer: string;
}

/**
 * Temel bilgiler DTO'su
 */
export class BasicsDto {
  @ApiPropertyOptional({ description: 'Boy (cm)', minimum: 100, maximum: 250 })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(250)
  height?: number;

  @ApiPropertyOptional({ description: 'Burç' })
  @IsOptional()
  @IsString()
  zodiac?: string;

  @ApiPropertyOptional({
    description: 'Eğitim seviyesi',
    enum: EducationLevel,
  })
  @IsOptional()
  @IsEnum(EducationLevel)
  education?: EducationLevel;

  @ApiPropertyOptional({ description: 'Meslek' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  work?: string;

  @ApiPropertyOptional({ description: 'Şirket' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  company?: string;

  @ApiPropertyOptional({ description: 'Yaşadığı şehir' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  livingIn?: string;

  @ApiPropertyOptional({ description: 'Bildiği diller', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({ description: 'Din' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  religion?: string;
}

/**
 * Yaşam tarzı DTO'su
 */
export class LifestyleDto {
  @ApiPropertyOptional({ description: 'Sigara', enum: LifestyleOption })
  @IsOptional()
  @IsEnum(LifestyleOption)
  smoking?: LifestyleOption;

  @ApiPropertyOptional({ description: 'Alkol', enum: LifestyleOption })
  @IsOptional()
  @IsEnum(LifestyleOption)
  drinking?: LifestyleOption;

  @ApiPropertyOptional({ description: 'Spor', enum: LifestyleOption })
  @IsOptional()
  @IsEnum(LifestyleOption)
  workout?: LifestyleOption;

  @ApiPropertyOptional({ description: 'Evcil hayvan', enum: PetStatus })
  @IsOptional()
  @IsEnum(PetStatus)
  pets?: PetStatus;

  @ApiPropertyOptional({ description: 'Çocuk durumu', enum: ChildrenStatus })
  @IsOptional()
  @IsEnum(ChildrenStatus)
  children?: ChildrenStatus;
}

/**
 * Tercihler DTO'su
 */
export class PreferencesDto {
  @ApiPropertyOptional({
    description: 'Cinsiyet tercihi',
    enum: GenderPreference,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(GenderPreference, { each: true })
  genderPreference?: GenderPreference[];

  @ApiPropertyOptional({
    description: 'Minimum yaş',
    minimum: 18,
    maximum: 100,
    default: 18,
  })
  @IsOptional()
  @IsNumber()
  @Min(18)
  @Max(100)
  minAge?: number;

  @ApiPropertyOptional({
    description: 'Maximum yaş',
    minimum: 18,
    maximum: 100,
    default: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(18)
  @Max(100)
  maxAge?: number;

  @ApiPropertyOptional({
    description: 'Maximum mesafe (km)',
    minimum: 1,
    maximum: 500,
    default: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  maxDistance?: number;

  @ApiPropertyOptional({
    description: 'Keşfette görünsün mü?',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  showMe?: boolean;
}

/**
 * Ayarlar DTO'su
 */
export class SettingsDto {
  @ApiPropertyOptional({ description: 'Yaşı gizle', default: false })
  @IsOptional()
  @IsBoolean()
  hideAge?: boolean;

  @ApiPropertyOptional({ description: 'Mesafeyi gizle', default: false })
  @IsOptional()
  @IsBoolean()
  hideDistance?: boolean;

  @ApiPropertyOptional({ description: 'Gizli mod', default: false })
  @IsOptional()
  @IsBoolean()
  incognitoMode?: boolean;
}

/**
 * Konum DTO'su
 */
export class LocationDto {
  @ApiProperty({
    description: 'Koordinatlar [longitude, latitude]',
    type: [Number],
    example: [28.9784, 41.0082],
  })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  coordinates: number[];
}

/**
 * Flört profili oluşturma DTO'su
 */
export class CreateDatingProfileDto {
  @ApiProperty({
    description: 'Fotoğraflar (en az 1, en fazla 6)',
    type: [PhotoDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => PhotoDto)
  photos: PhotoDto[];

  @ApiProperty({
    description: 'Biyografi',
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  bio: string;

  @ApiPropertyOptional({
    description: 'Hakkımda soruları (en fazla 3)',
    type: [PromptDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => PromptDto)
  prompts?: PromptDto[];

  @ApiPropertyOptional({ description: 'Temel bilgiler', type: BasicsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BasicsDto)
  basics?: BasicsDto;

  @ApiPropertyOptional({ description: 'Yaşam tarzı', type: LifestyleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LifestyleDto)
  lifestyle?: LifestyleDto;

  @ApiPropertyOptional({
    description: 'İlgi alanları',
    type: [String],
    example: ['müzik', 'sinema', 'spor'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @ApiPropertyOptional({ description: 'Tercihler', type: PreferencesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PreferencesDto)
  preferences?: PreferencesDto;

  @ApiPropertyOptional({ description: 'Ayarlar', type: SettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SettingsDto)
  settings?: SettingsDto;

  @ApiProperty({ description: 'Konum', type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;
}

/**
 * Flört profili güncelleme DTO'su
 * Tüm alanlar opsiyonel
 */
export class UpdateDatingProfileDto extends PartialType(
  CreateDatingProfileDto,
) {
  @ApiPropertyOptional({ description: 'Profil aktif mi?', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * Profil yanıt DTO'su
 */
export class DatingProfileResponseDto {
  @ApiProperty({ description: 'Profil ID' })
  id: string;

  @ApiProperty({ description: 'Kullanıcı ID' })
  userId: string;

  @ApiProperty({ description: 'Aktif mi?' })
  isActive: boolean;

  @ApiProperty({ description: 'Fotoğraflar', type: [PhotoDto] })
  photos: PhotoDto[];

  @ApiProperty({ description: 'Biyografi' })
  bio: string;

  @ApiPropertyOptional({ description: 'Promptlar', type: [PromptDto] })
  prompts?: PromptDto[];

  @ApiPropertyOptional({ description: 'Temel bilgiler', type: BasicsDto })
  basics?: BasicsDto;

  @ApiPropertyOptional({ description: 'Yaşam tarzı', type: LifestyleDto })
  lifestyle?: LifestyleDto;

  @ApiPropertyOptional({ description: 'İlgi alanları', type: [String] })
  interests?: string[];

  @ApiPropertyOptional({ description: 'Tercihler', type: PreferencesDto })
  preferences?: PreferencesDto;

  @ApiPropertyOptional({ description: 'Ayarlar', type: SettingsDto })
  settings?: SettingsDto;

  @ApiProperty({ description: 'İstatistikler' })
  stats: {
    likesReceived: number;
    likesSent: number;
    matchesCount: number;
  };

  @ApiProperty({ description: 'Fotoğraf doğrulaması yapıldı mı?' })
  photoVerified: boolean;

  @ApiProperty({ description: 'Oluşturulma tarihi' })
  createdAt: Date;

  @ApiProperty({ description: 'Güncellenme tarihi' })
  updatedAt: Date;
}
