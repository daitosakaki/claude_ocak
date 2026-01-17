import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Controller
import { AdminController } from './admin.controller';

// Services
import { AdminService } from './admin.service';
import { DashboardService } from './services/dashboard.service';
import { UserManagementService } from './services/user-management.service';
import { ModerationService } from './services/moderation.service';
import { FeatureFlagService } from './services/feature-flag.service';
import { AuditLogService } from './services/audit-log.service';

// Schemas
import { AdminUser, AdminUserSchema } from './schemas/admin-user.schema';
import { AdminLog, AdminLogSchema } from './schemas/admin-log.schema';
import { Report, ReportSchema } from './schemas/report.schema';
import { FeatureFlag, FeatureFlagSchema } from './schemas/feature-flag.schema';

// User ve Post şemaları (diğer servislerle paylaşılan)
import { User, UserSchema } from './schemas/user.schema';
import { Post, PostSchema } from './schemas/post.schema';
import { Comment, CommentSchema } from './schemas/comment.schema';

// Guards
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { PermissionGuard } from './guards/permission.guard';

// Strategies
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';

@Module({
  imports: [
    // Passport modülü
    PassportModule.register({ defaultStrategy: 'admin-jwt' }),

    // JWT modülü
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('ADMIN_JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('ADMIN_JWT_EXPIRES_IN', '8h'),
          issuer: 'superapp-admin',
        },
      }),
      inject: [ConfigService],
    }),

    // MongoDB şemaları
    MongooseModule.forFeature([
      { name: AdminUser.name, schema: AdminUserSchema },
      { name: AdminLog.name, schema: AdminLogSchema },
      { name: Report.name, schema: ReportSchema },
      { name: FeatureFlag.name, schema: FeatureFlagSchema },
      { name: User.name, schema: UserSchema },
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [
    // Services
    AdminService,
    DashboardService,
    UserManagementService,
    ModerationService,
    FeatureFlagService,
    AuditLogService,

    // Strategy
    AdminJwtStrategy,

    // Guards
    AdminAuthGuard,
    PermissionGuard,
  ],
  exports: [
    AdminService,
    FeatureFlagService,
    JwtModule,
  ],
})
export class AdminModule {}
