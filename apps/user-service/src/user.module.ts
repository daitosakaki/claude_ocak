import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from './user.controller';
import { UserService } from './user.service';

// Schemas
import { User, UserSchema } from './schemas/user.schema';
import { UserSettings, UserSettingsSchema } from './schemas/user-settings.schema';
import { UserKeys, UserKeysSchema } from './schemas/user-keys.schema';
import { Follow, FollowSchema } from './schemas/follow.schema';

// Services
import { ProfileService } from './services/profile.service';
import { SettingsService } from './services/settings.service';
import { FollowService } from './services/follow.service';
import { BlockService } from './services/block.service';
import { KeysService } from './services/keys.service';

// Events
import { UserPublisher } from './events/user.publisher';

// Shared
import { JwtAuthModule } from '@superapp/shared-auth';
import { RedisModule } from '@superapp/shared-database';

@Module({
  imports: [
    // Mongoose Schemas
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserSettings.name, schema: UserSettingsSchema },
      { name: UserKeys.name, schema: UserKeysSchema },
      { name: Follow.name, schema: FollowSchema },
    ]),

    // JWT Auth
    JwtAuthModule,

    // Redis
    RedisModule,
  ],
  controllers: [UserController],
  providers: [
    UserService,
    ProfileService,
    SettingsService,
    FollowService,
    BlockService,
    KeysService,
    UserPublisher,
  ],
  exports: [UserService, ProfileService, FollowService],
})
export class UserModule {}
