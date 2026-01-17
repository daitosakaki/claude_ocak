import { PartialType } from '@nestjs/swagger';
import { CreateListingDto } from './create-listing.dto';

/**
 * İlan güncelleme DTO'su
 * CreateListingDto'nun tüm alanlarını opsiyonel yapar
 */
export class UpdateListingDto extends PartialType(CreateListingDto) {}
