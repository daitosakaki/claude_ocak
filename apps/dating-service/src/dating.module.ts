import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatingController } from './dating.controller';
import { DatingService } from './dating.service';
import { ProfileService } from './services/profile.service';
import { DiscoverService } from './services/discover.service';
import { SwipeService } from './services/swipe.service';
import { MatchService } from './services/match.service';
import { BoostService } from './services/boost.service';
import { DatingPublisher } from './events/dating.publisher';
import {
  DatingProfile,
  DatingProfileSchema,
} from './schemas/dating-profile.schema';
import { Swipe, SwipeSchema } from './schemas/swipe.schema';
import { Match, MatchSchema } from './schemas/match.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DatingProfile.name, schema: DatingProfileSchema },
      { name: Swipe.name, schema: SwipeSchema },
      { name: Match.name, schema: MatchSchema },
    ]),
  ],
  controllers: [DatingController],
  providers: [
    DatingService,
    ProfileService,
    DiscoverService,
    SwipeService,
    MatchService,
    BoostService,
    DatingPublisher,
  ],
  exports: [DatingService],
})
export class DatingModule {}
