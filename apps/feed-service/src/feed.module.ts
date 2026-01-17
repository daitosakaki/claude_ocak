import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';

// Controller
import { FeedController } from './feed.controller';

// Services
import { FeedService } from './feed.service';
import { HomeFeedService } from './services/home-feed.service';
import { ExploreFeedService } from './services/explore-feed.service';
import { TrendingService } from './services/trending.service';
import { FeedCacheService } from './services/feed-cache.service';

// Subscribers
import { PostSubscriber } from './subscribers/post.subscriber';
import { InteractionSubscriber } from './subscribers/interaction.subscriber';

// Schemas (Feed service sadece okuma yapar, Post schema'yı import eder)
import { Post, PostSchema } from './schemas/post.schema';
import { Follow, FollowSchema } from './schemas/follow.schema';
import { Hashtag, HashtagSchema } from './schemas/hashtag.schema';
import { Trend, TrendSchema } from './schemas/trend.schema';

/**
 * Feed Module
 * Timeline, Explore ve Trending özellikleri
 */
@Module({
  imports: [
    ConfigModule,
    
    // HTTP modülü (diğer servislere istek için)
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        timeout: configService.get<number>('HTTP_TIMEOUT', 5000),
        maxRedirects: 3,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      inject: [ConfigService],
    }),

    // MongoDB şemaları
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Follow.name, schema: FollowSchema },
      { name: Hashtag.name, schema: HashtagSchema },
      { name: Trend.name, schema: TrendSchema },
    ]),
  ],
  controllers: [FeedController],
  providers: [
    // Ana servis
    FeedService,
    
    // Alt servisler
    HomeFeedService,
    ExploreFeedService,
    TrendingService,
    FeedCacheService,
    
    // Pub/Sub subscribers
    PostSubscriber,
    InteractionSubscriber,
  ],
  exports: [FeedService, FeedCacheService],
})
export class FeedModule {}
