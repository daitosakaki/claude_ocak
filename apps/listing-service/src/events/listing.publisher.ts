import { Injectable, Logger } from '@nestjs/common';
import { ListingDocument } from '../schemas/listing.schema';

/**
 * İlan event publisher
 * Pub/Sub üzerinden diğer servislere event yayınlar
 */
@Injectable()
export class ListingPublisher {
  private readonly logger = new Logger(ListingPublisher.name);

  // TODO: GCP Pub/Sub client'ı inject edilecek
  // constructor(private readonly pubsubService: PubSubService) {}

  /**
   * İlan oluşturuldu eventi
   */
  async publishListingCreated(listing: ListingDocument): Promise<void> {
    const event: ListingCreatedEvent = {
      type: 'listing.created',
      data: {
        listingId: listing._id.toString(),
        sellerId: listing.sellerId.toString(),
        title: listing.title,
        category: listing.category.path,
        price: listing.price.amount,
        city: listing.location.city,
      },
      timestamp: new Date().toISOString(),
    };

    await this.publish('listing-events', event);

    this.logger.log(`Event yayınlandı: listing.created - ${listing._id}`);
  }

  /**
   * İlan güncellendi eventi
   */
  async publishListingUpdated(listing: ListingDocument): Promise<void> {
    const event: ListingUpdatedEvent = {
      type: 'listing.updated',
      data: {
        listingId: listing._id.toString(),
        sellerId: listing.sellerId.toString(),
        title: listing.title,
        price: listing.price.amount,
        status: listing.status,
      },
      timestamp: new Date().toISOString(),
    };

    await this.publish('listing-events', event);

    this.logger.log(`Event yayınlandı: listing.updated - ${listing._id}`);
  }

  /**
   * İlan silindi eventi
   */
  async publishListingDeleted(listingId: string, sellerId: string): Promise<void> {
    const event: ListingDeletedEvent = {
      type: 'listing.deleted',
      data: {
        listingId,
        sellerId,
      },
      timestamp: new Date().toISOString(),
    };

    await this.publish('listing-events', event);

    this.logger.log(`Event yayınlandı: listing.deleted - ${listingId}`);
  }

  /**
   * İlan görüntülendi eventi
   */
  async publishListingViewed(
    listingId: string,
    viewerId: string | null,
  ): Promise<void> {
    const event: ListingViewedEvent = {
      type: 'listing.viewed',
      data: {
        listingId,
        viewerId,
      },
      timestamp: new Date().toISOString(),
    };

    await this.publish('listing-events', event);
  }

  /**
   * İlan favorilere eklendi eventi
   */
  async publishListingFavorited(
    listingId: string,
    userId: string,
    sellerId: string,
  ): Promise<void> {
    const event: ListingFavoritedEvent = {
      type: 'listing.favorited',
      data: {
        listingId,
        userId,
        sellerId,
      },
      timestamp: new Date().toISOString(),
    };

    await this.publish('listing-events', event);

    this.logger.log(`Event yayınlandı: listing.favorited - ${listingId}`);
  }

  /**
   * İlan satıldı eventi
   */
  async publishListingSold(listing: ListingDocument): Promise<void> {
    const event: ListingSoldEvent = {
      type: 'listing.sold',
      data: {
        listingId: listing._id.toString(),
        sellerId: listing.sellerId.toString(),
        title: listing.title,
        price: listing.price.amount,
      },
      timestamp: new Date().toISOString(),
    };

    await this.publish('listing-events', event);

    this.logger.log(`Event yayınlandı: listing.sold - ${listing._id}`);
  }

  /**
   * Pub/Sub'a mesaj gönder
   */
  private async publish(topic: string, event: ListingEvent): Promise<void> {
    try {
      // TODO: Gerçek Pub/Sub implementasyonu
      // await this.pubsubService.publish(topic, event);

      // Şimdilik logluyoruz
      this.logger.debug(`[${topic}] ${JSON.stringify(event)}`);
    } catch (error) {
      this.logger.error(`Event yayınlama hatası: ${error}`);
      // Event yayınlama hatası kritik değil, işleme devam et
    }
  }
}

// ==================== Event Tipleri ====================

interface BaseEvent {
  type: string;
  timestamp: string;
}

interface ListingCreatedEvent extends BaseEvent {
  type: 'listing.created';
  data: {
    listingId: string;
    sellerId: string;
    title: string;
    category: string;
    price: number;
    city: string;
  };
}

interface ListingUpdatedEvent extends BaseEvent {
  type: 'listing.updated';
  data: {
    listingId: string;
    sellerId: string;
    title: string;
    price: number;
    status: string;
  };
}

interface ListingDeletedEvent extends BaseEvent {
  type: 'listing.deleted';
  data: {
    listingId: string;
    sellerId: string;
  };
}

interface ListingViewedEvent extends BaseEvent {
  type: 'listing.viewed';
  data: {
    listingId: string;
    viewerId: string | null;
  };
}

interface ListingFavoritedEvent extends BaseEvent {
  type: 'listing.favorited';
  data: {
    listingId: string;
    userId: string;
    sellerId: string;
  };
}

interface ListingSoldEvent extends BaseEvent {
  type: 'listing.sold';
  data: {
    listingId: string;
    sellerId: string;
    title: string;
    price: number;
  };
}

type ListingEvent =
  | ListingCreatedEvent
  | ListingUpdatedEvent
  | ListingDeletedEvent
  | ListingViewedEvent
  | ListingFavoritedEvent
  | ListingSoldEvent;
