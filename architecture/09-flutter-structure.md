# Flutter Proje Yapısı

## Genel Bakış

| Property | Value |
|----------|-------|
| Framework | Flutter 3.x |
| Language | Dart 3.x |
| State Management | Bloc/Cubit |
| DI | GetIt + Injectable |
| Navigation | GoRouter |
| HTTP | Dio |
| WebSocket | socket_io_client |
| Local DB | SQLite (sqflite) |
| Secure Storage | flutter_secure_storage |

---

## Klasör Yapısı

```
lib/
├── main.dart                         # Entry point
├── app.dart                          # App widget, MaterialApp
│
├── core/                             # Shared utilities & base classes
│   ├── constants/
│   │   ├── app_constants.dart        # App-wide constants
│   │   ├── api_constants.dart        # API URLs, endpoints
│   │   ├── storage_keys.dart         # Storage key constants
│   │   └── ui_constants.dart         # UI dimensions, durations
│   │
│   ├── theme/
│   │   ├── app_theme.dart            # ThemeData definitions
│   │   ├── app_colors.dart           # Color palette
│   │   ├── app_typography.dart       # Text styles
│   │   └── app_shadows.dart          # Box shadows
│   │
│   ├── utils/
│   │   ├── validators.dart           # Input validators
│   │   ├── formatters.dart           # Date, number formatters
│   │   ├── helpers.dart              # Utility functions
│   │   ├── extensions.dart           # Dart extensions
│   │   └── debouncer.dart            # Debounce helper
│   │
│   ├── errors/
│   │   ├── failures.dart             # Failure classes
│   │   ├── exceptions.dart           # Custom exceptions
│   │   └── error_handler.dart        # Global error handling
│   │
│   └── network/
│       ├── api_client.dart           # Dio setup
│       ├── api_interceptors.dart     # Auth, logging interceptors
│       ├── network_info.dart         # Connectivity check
│       └── api_response.dart         # Response wrapper
│
├── config/
│   ├── env.dart                      # Environment variables
│   ├── routes.dart                   # GoRouter configuration
│   └── injection.dart                # GetIt setup
│
├── services/                         # Global singleton services
│   ├── auth_service.dart             # Auth state management
│   ├── storage_service.dart          # Secure storage wrapper
│   ├── socket_service.dart           # WebSocket management
│   ├── notification_service.dart     # FCM & local notifications
│   ├── encryption_service.dart       # E2EE encryption
│   ├── feature_flag_service.dart     # Feature flags
│   ├── analytics_service.dart        # Analytics tracking
│   └── connectivity_service.dart     # Network connectivity
│
├── features/                         # Feature modules
│   ├── auth/
│   ├── feed/
│   ├── post/
│   ├── profile/
│   ├── chat/
│   ├── notifications/
│   ├── settings/
│   ├── search/
│   ├── listings/                     # Faz 2
│   └── dating/                       # Faz 3
│
└── shared/                           # Shared widgets & components
    ├── widgets/
    │   ├── buttons/
    │   ├── inputs/
    │   ├── cards/
    │   ├── dialogs/
    │   ├── loaders/
    │   └── misc/
    └── layouts/
        ├── app_scaffold.dart
        └── responsive_layout.dart
```

---

## Feature Modül Yapısı

Her feature modülü Clean Architecture katmanlarına sahip:

```
features/
└── chat/
    │
    ├── data/                         # DATA LAYER
    │   ├── datasources/
    │   │   ├── chat_remote_datasource.dart      # API calls
    │   │   ├── chat_socket_datasource.dart      # WebSocket
    │   │   └── chat_local_datasource.dart       # SQLite cache
    │   │
    │   ├── models/
    │   │   ├── conversation_model.dart          # JSON serialization
    │   │   ├── message_model.dart
    │   │   └── typing_event_model.dart
    │   │
    │   └── repositories/
    │       └── chat_repository_impl.dart        # Repository implementation
    │
    ├── domain/                       # DOMAIN LAYER
    │   ├── entities/
    │   │   ├── conversation.dart                # Pure Dart classes
    │   │   ├── message.dart
    │   │   └── participant.dart
    │   │
    │   ├── repositories/
    │   │   └── chat_repository.dart             # Abstract repository
    │   │
    │   └── usecases/
    │       ├── get_conversations.dart
    │       ├── get_messages.dart
    │       ├── send_message.dart
    │       └── mark_as_read.dart
    │
    └── presentation/                 # PRESENTATION LAYER
        ├── bloc/
        │   ├── chat_list/
        │   │   ├── chat_list_cubit.dart
        │   │   └── chat_list_state.dart
        │   │
        │   ├── chat/
        │   │   ├── chat_cubit.dart
        │   │   └── chat_state.dart
        │   │
        │   └── typing/
        │       ├── typing_cubit.dart
        │       └── typing_state.dart
        │
        ├── pages/
        │   ├── chat_list_page.dart
        │   └── chat_page.dart
        │
        └── widgets/
            ├── conversation_tile.dart
            ├── message_bubble.dart
            ├── message_input.dart
            ├── typing_indicator.dart
            └── online_badge.dart
```

---

## Core Files

### main.dart

```dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'app.dart';
import 'config/injection.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize dependencies
  await configureDependencies();
  
  // Initialize services
  await sl<StorageService>().init();
  await sl<NotificationService>().init();
  
  // Run app
  runApp(const SuperApp());
}
```

### app.dart

```dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'config/routes.dart';
import 'core/theme/app_theme.dart';
import 'services/auth_service.dart';
import 'services/feature_flag_service.dart';

class SuperApp extends StatelessWidget {
  const SuperApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (_) => sl<AuthCubit>()..checkAuth()),
        BlocProvider(create: (_) => sl<FeatureFlagCubit>()..load()),
        BlocProvider(create: (_) => sl<NotificationCubit>()),
      ],
      child: MaterialApp.router(
        title: 'SuperApp',
        debugShowCheckedModeBanner: false,
        
        // Theme
        theme: AppTheme.light,
        darkTheme: AppTheme.dark,
        themeMode: ThemeMode.system,
        
        // Routing
        routerConfig: router,
        
        // Localization
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        supportedLocales: const [
          Locale('tr'),
          Locale('en'),
        ],
      ),
    );
  }
}
```

---

## Config Files

### env.dart

```dart
enum Environment { dev, staging, prod }

class Env {
  static Environment _env = Environment.dev;
  
  static void init(Environment env) {
    _env = env;
  }
  
  static String get apiBaseUrl {
    switch (_env) {
      case Environment.dev:
        return 'http://localhost:3000/v1';
      case Environment.staging:
        return 'https://api-staging.superapp.com/v1';
      case Environment.prod:
        return 'https://api.superapp.com/v1';
    }
  }
  
  static String get socketUrl {
    switch (_env) {
      case Environment.dev:
        return 'http://localhost:3007';
      case Environment.staging:
        return 'https://api-staging.superapp.com';
      case Environment.prod:
        return 'https://api.superapp.com';
    }
  }
  
  static bool get isProduction => _env == Environment.prod;
}
```

### routes.dart

```dart
import 'package:go_router/go_router.dart';

import '../features/auth/presentation/pages/login_page.dart';
import '../features/auth/presentation/pages/register_page.dart';
import '../features/feed/presentation/pages/feed_page.dart';
import '../features/profile/presentation/pages/profile_page.dart';
import '../features/chat/presentation/pages/chat_list_page.dart';
import '../features/chat/presentation/pages/chat_page.dart';
import '../features/settings/presentation/pages/settings_page.dart';
import '../services/auth_service.dart';

final router = GoRouter(
  initialLocation: '/',
  debugLogDiagnostics: true,
  
  // Redirect logic
  redirect: (context, state) {
    final isLoggedIn = sl<AuthService>().isLoggedIn;
    final isAuthRoute = state.matchedLocation.startsWith('/auth');
    
    if (!isLoggedIn && !isAuthRoute) {
      return '/auth/login';
    }
    if (isLoggedIn && isAuthRoute) {
      return '/';
    }
    return null;
  },
  
  routes: [
    // Auth routes
    GoRoute(
      path: '/auth/login',
      name: 'login',
      builder: (_, __) => const LoginPage(),
    ),
    GoRoute(
      path: '/auth/register',
      name: 'register',
      builder: (_, __) => const RegisterPage(),
    ),
    
    // Main shell with bottom navigation
    ShellRoute(
      builder: (_, __, child) => MainShell(child: child),
      routes: [
        // Feed tab
        GoRoute(
          path: '/',
          name: 'feed',
          builder: (_, __) => const FeedPage(),
          routes: [
            GoRoute(
              path: 'post/:postId',
              name: 'post-detail',
              builder: (_, state) => PostDetailPage(
                postId: state.pathParameters['postId']!,
              ),
            ),
          ],
        ),
        
        // Search tab
        GoRoute(
          path: '/search',
          name: 'search',
          builder: (_, __) => const SearchPage(),
        ),
        
        // Create post
        GoRoute(
          path: '/create',
          name: 'create-post',
          builder: (_, __) => const CreatePostPage(),
        ),
        
        // Notifications tab
        GoRoute(
          path: '/notifications',
          name: 'notifications',
          builder: (_, __) => const NotificationsPage(),
        ),
        
        // Profile tab
        GoRoute(
          path: '/profile',
          name: 'my-profile',
          builder: (_, __) => const ProfilePage(),
        ),
      ],
    ),
    
    // Profile (other users)
    GoRoute(
      path: '/user/:userId',
      name: 'user-profile',
      builder: (_, state) => ProfilePage(
        userId: state.pathParameters['userId']!,
      ),
    ),
    
    // Chat routes
    GoRoute(
      path: '/chats',
      name: 'chat-list',
      builder: (_, __) => const ChatListPage(),
    ),
    GoRoute(
      path: '/chat/:conversationId',
      name: 'chat',
      builder: (_, state) => ChatPage(
        conversationId: state.pathParameters['conversationId']!,
      ),
    ),
    
    // Settings
    GoRoute(
      path: '/settings',
      name: 'settings',
      builder: (_, __) => const SettingsPage(),
      routes: [
        GoRoute(
          path: 'profile',
          name: 'edit-profile',
          builder: (_, __) => const EditProfilePage(),
        ),
        GoRoute(
          path: 'privacy',
          name: 'privacy-settings',
          builder: (_, __) => const PrivacySettingsPage(),
        ),
        GoRoute(
          path: 'notifications',
          name: 'notification-settings',
          builder: (_, __) => const NotificationSettingsPage(),
        ),
      ],
    ),
  ],
);
```

### injection.dart

```dart
import 'package:get_it/get_it.dart';

final sl = GetIt.instance;

Future<void> configureDependencies() async {
  // ==================== CORE ====================
  
  // Network
  sl.registerLazySingleton<Dio>(() => createDio());
  sl.registerLazySingleton<ApiClient>(() => ApiClient(sl()));
  sl.registerLazySingleton<NetworkInfo>(() => NetworkInfoImpl());
  
  // ==================== SERVICES ====================
  
  sl.registerLazySingleton<StorageService>(() => StorageServiceImpl());
  sl.registerLazySingleton<AuthService>(() => AuthServiceImpl(sl(), sl()));
  sl.registerLazySingleton<SocketService>(() => SocketServiceImpl());
  sl.registerLazySingleton<EncryptionService>(() => EncryptionServiceImpl(sl()));
  sl.registerLazySingleton<FeatureFlagService>(() => FeatureFlagServiceImpl(sl()));
  sl.registerLazySingleton<NotificationService>(() => NotificationServiceImpl());
  
  // ==================== AUTH FEATURE ====================
  
  // Data sources
  sl.registerLazySingleton<AuthRemoteDatasource>(
    () => AuthRemoteDatasourceImpl(sl()),
  );
  sl.registerLazySingleton<AuthLocalDatasource>(
    () => AuthLocalDatasourceImpl(sl()),
  );
  
  // Repository
  sl.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(sl(), sl(), sl()),
  );
  
  // Use cases
  sl.registerLazySingleton(() => LoginUseCase(sl()));
  sl.registerLazySingleton(() => RegisterUseCase(sl()));
  sl.registerLazySingleton(() => LogoutUseCase(sl()));
  sl.registerLazySingleton(() => RefreshTokenUseCase(sl()));
  
  // Cubit
  sl.registerFactory(() => AuthCubit(sl(), sl(), sl(), sl()));
  
  // ==================== USER FEATURE ====================
  
  sl.registerLazySingleton<UserRemoteDatasource>(
    () => UserRemoteDatasourceImpl(sl()),
  );
  sl.registerLazySingleton<UserRepository>(
    () => UserRepositoryImpl(sl(), sl()),
  );
  sl.registerLazySingleton(() => GetUserUseCase(sl()));
  sl.registerLazySingleton(() => UpdateProfileUseCase(sl()));
  sl.registerLazySingleton(() => FollowUserUseCase(sl()));
  sl.registerFactory(() => ProfileCubit(sl(), sl(), sl()));
  
  // ==================== FEED FEATURE ====================
  
  sl.registerLazySingleton<FeedRemoteDatasource>(
    () => FeedRemoteDatasourceImpl(sl()),
  );
  sl.registerLazySingleton<FeedRepository>(
    () => FeedRepositoryImpl(sl()),
  );
  sl.registerLazySingleton(() => GetHomeFeedUseCase(sl()));
  sl.registerLazySingleton(() => GetExploreFeedUseCase(sl()));
  sl.registerFactory(() => FeedCubit(sl(), sl()));
  
  // ==================== POST FEATURE ====================
  
  sl.registerLazySingleton<PostRemoteDatasource>(
    () => PostRemoteDatasourceImpl(sl()),
  );
  sl.registerLazySingleton<PostRepository>(
    () => PostRepositoryImpl(sl()),
  );
  sl.registerLazySingleton(() => CreatePostUseCase(sl()));
  sl.registerLazySingleton(() => LikePostUseCase(sl()));
  sl.registerFactory(() => PostCubit(sl(), sl()));
  
  // ==================== CHAT FEATURE ====================
  
  sl.registerLazySingleton<ChatRemoteDatasource>(
    () => ChatRemoteDatasourceImpl(sl()),
  );
  sl.registerLazySingleton<ChatSocketDatasource>(
    () => ChatSocketDatasourceImpl(sl()),
  );
  sl.registerLazySingleton<ChatLocalDatasource>(
    () => ChatLocalDatasourceImpl(),
  );
  sl.registerLazySingleton<ChatRepository>(
    () => ChatRepositoryImpl(sl(), sl(), sl(), sl()),
  );
  sl.registerLazySingleton(() => GetConversationsUseCase(sl()));
  sl.registerLazySingleton(() => GetMessagesUseCase(sl()));
  sl.registerLazySingleton(() => SendMessageUseCase(sl()));
  sl.registerFactory(() => ChatListCubit(sl()));
  sl.registerFactory(() => ChatCubit(sl(), sl(), sl(), sl()));
  sl.registerFactory(() => TypingCubit(sl()));
  
  // ==================== NOTIFICATION FEATURE ====================
  
  sl.registerLazySingleton<NotificationRemoteDatasource>(
    () => NotificationRemoteDatasourceImpl(sl()),
  );
  sl.registerLazySingleton<NotificationRepository>(
    () => NotificationRepositoryImpl(sl()),
  );
  sl.registerFactory(() => NotificationCubit(sl()));
}
```

---

## State Management

### Cubit Pattern

```dart
// ==================== STATE ====================

abstract class FeedState extends Equatable {
  const FeedState();
  
  @override
  List<Object?> get props => [];
}

class FeedInitial extends FeedState {}

class FeedLoading extends FeedState {}

class FeedLoaded extends FeedState {
  final List<Post> posts;
  final bool hasMore;
  final String? nextCursor;
  
  const FeedLoaded({
    required this.posts,
    this.hasMore = true,
    this.nextCursor,
  });
  
  @override
  List<Object?> get props => [posts, hasMore, nextCursor];
  
  FeedLoaded copyWith({
    List<Post>? posts,
    bool? hasMore,
    String? nextCursor,
  }) {
    return FeedLoaded(
      posts: posts ?? this.posts,
      hasMore: hasMore ?? this.hasMore,
      nextCursor: nextCursor ?? this.nextCursor,
    );
  }
}

class FeedLoadingMore extends FeedLoaded {
  const FeedLoadingMore({
    required super.posts,
    super.hasMore,
    super.nextCursor,
  });
}

class FeedError extends FeedState {
  final String message;
  final List<Post>? previousPosts;
  
  const FeedError(this.message, {this.previousPosts});
  
  @override
  List<Object?> get props => [message, previousPosts];
}

// ==================== CUBIT ====================

class FeedCubit extends Cubit<FeedState> {
  final GetHomeFeedUseCase _getHomeFeed;
  final GetExploreFeedUseCase _getExploreFeed;
  
  FeedCubit(this._getHomeFeed, this._getExploreFeed) : super(FeedInitial());
  
  Future<void> loadHomeFeed() async {
    emit(FeedLoading());
    
    final result = await _getHomeFeed(cursor: null);
    
    result.fold(
      (failure) => emit(FeedError(failure.message)),
      (response) => emit(FeedLoaded(
        posts: response.posts,
        hasMore: response.hasMore,
        nextCursor: response.nextCursor,
      )),
    );
  }
  
  Future<void> loadMore() async {
    final currentState = state;
    if (currentState is! FeedLoaded || !currentState.hasMore) return;
    if (currentState is FeedLoadingMore) return;
    
    emit(FeedLoadingMore(
      posts: currentState.posts,
      hasMore: currentState.hasMore,
      nextCursor: currentState.nextCursor,
    ));
    
    final result = await _getHomeFeed(cursor: currentState.nextCursor);
    
    result.fold(
      (failure) => emit(FeedError(failure.message, previousPosts: currentState.posts)),
      (response) => emit(FeedLoaded(
        posts: [...currentState.posts, ...response.posts],
        hasMore: response.hasMore,
        nextCursor: response.nextCursor,
      )),
    );
  }
  
  Future<void> refresh() async {
    final currentState = state;
    final previousPosts = currentState is FeedLoaded ? currentState.posts : null;
    
    final result = await _getHomeFeed(cursor: null);
    
    result.fold(
      (failure) => emit(FeedError(failure.message, previousPosts: previousPosts)),
      (response) => emit(FeedLoaded(
        posts: response.posts,
        hasMore: response.hasMore,
        nextCursor: response.nextCursor,
      )),
    );
  }
  
  void updatePost(Post updatedPost) {
    final currentState = state;
    if (currentState is! FeedLoaded) return;
    
    final updatedPosts = currentState.posts.map((post) {
      return post.id == updatedPost.id ? updatedPost : post;
    }).toList();
    
    emit(currentState.copyWith(posts: updatedPosts));
  }
  
  void removePost(String postId) {
    final currentState = state;
    if (currentState is! FeedLoaded) return;
    
    final updatedPosts = currentState.posts
        .where((post) => post.id != postId)
        .toList();
    
    emit(currentState.copyWith(posts: updatedPosts));
  }
}
```

---

## Domain Layer

### Entity

```dart
// domain/entities/user.dart

class User extends Equatable {
  final String id;
  final String username;
  final String displayName;
  final String? email;
  final String? phone;
  final String? avatar;
  final String? coverImage;
  final String? bio;
  final bool isPrivate;
  final bool isVerified;
  final UserStats stats;
  final Subscription subscription;
  final DateTime createdAt;
  
  // Relationship states (context-dependent)
  final bool? isFollowing;
  final bool? isFollowedBy;
  final bool? isBlocked;
  
  const User({
    required this.id,
    required this.username,
    required this.displayName,
    this.email,
    this.phone,
    this.avatar,
    this.coverImage,
    this.bio,
    this.isPrivate = false,
    this.isVerified = false,
    required this.stats,
    required this.subscription,
    required this.createdAt,
    this.isFollowing,
    this.isFollowedBy,
    this.isBlocked,
  });
  
  bool get isPremium => subscription.plan != SubscriptionPlan.free;
  
  @override
  List<Object?> get props => [id, username, displayName, stats, subscription];
}

class UserStats extends Equatable {
  final int postsCount;
  final int followersCount;
  final int followingCount;
  
  const UserStats({
    required this.postsCount,
    required this.followersCount,
    required this.followingCount,
  });
  
  @override
  List<Object?> get props => [postsCount, followersCount, followingCount];
}
```

### Repository (Abstract)

```dart
// domain/repositories/user_repository.dart

abstract class UserRepository {
  Future<Either<Failure, User>> getUser(String userId);
  Future<Either<Failure, User>> getUserByUsername(String username);
  Future<Either<Failure, User>> getCurrentUser();
  Future<Either<Failure, User>> updateProfile(UpdateProfileParams params);
  Future<Either<Failure, FollowResult>> followUser(String userId);
  Future<Either<Failure, void>> unfollowUser(String userId);
  Future<Either<Failure, void>> blockUser(String userId);
  Future<Either<Failure, void>> unblockUser(String userId);
  Future<Either<Failure, PaginatedList<User>>> getFollowers(String userId, {String? cursor});
  Future<Either<Failure, PaginatedList<User>>> getFollowing(String userId, {String? cursor});
}
```

### Use Case

```dart
// domain/usecases/follow_user.dart

class FollowUserUseCase implements UseCase<FollowResult, String> {
  final UserRepository _repository;
  
  FollowUserUseCase(this._repository);
  
  @override
  Future<Either<Failure, FollowResult>> call(String userId) {
    return _repository.followUser(userId);
  }
}

// Base use case
abstract class UseCase<Type, Params> {
  Future<Either<Failure, Type>> call(Params params);
}

class NoParams extends Equatable {
  @override
  List<Object?> get props => [];
}
```

---

## Data Layer

### Model

```dart
// data/models/user_model.dart

class UserModel extends User {
  const UserModel({
    required super.id,
    required super.username,
    required super.displayName,
    super.email,
    super.phone,
    super.avatar,
    super.coverImage,
    super.bio,
    super.isPrivate,
    super.isVerified,
    required super.stats,
    required super.subscription,
    required super.createdAt,
    super.isFollowing,
    super.isFollowedBy,
    super.isBlocked,
  });
  
  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      username: json['username'] as String,
      displayName: json['displayName'] as String,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      avatar: json['avatar'] as String?,
      coverImage: json['coverImage'] as String?,
      bio: json['bio'] as String?,
      isPrivate: json['isPrivate'] as bool? ?? false,
      isVerified: json['isVerified'] as bool? ?? false,
      stats: UserStatsModel.fromJson(json['stats'] as Map<String, dynamic>),
      subscription: SubscriptionModel.fromJson(json['subscription'] as Map<String, dynamic>),
      createdAt: DateTime.parse(json['createdAt'] as String),
      isFollowing: json['isFollowing'] as bool?,
      isFollowedBy: json['isFollowedBy'] as bool?,
      isBlocked: json['isBlocked'] as bool?,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'displayName': displayName,
      'email': email,
      'phone': phone,
      'avatar': avatar,
      'coverImage': coverImage,
      'bio': bio,
      'isPrivate': isPrivate,
      'isVerified': isVerified,
      'stats': (stats as UserStatsModel).toJson(),
      'subscription': (subscription as SubscriptionModel).toJson(),
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
```

### Remote Datasource

```dart
// data/datasources/user_remote_datasource.dart

abstract class UserRemoteDatasource {
  Future<UserModel> getUser(String userId);
  Future<UserModel> getCurrentUser();
  Future<UserModel> updateProfile(UpdateProfileParams params);
  Future<FollowResultModel> followUser(String userId);
  Future<void> unfollowUser(String userId);
}

class UserRemoteDatasourceImpl implements UserRemoteDatasource {
  final ApiClient _client;
  
  UserRemoteDatasourceImpl(this._client);
  
  @override
  Future<UserModel> getUser(String userId) async {
    final response = await _client.get('/users/$userId');
    return UserModel.fromJson(response.data['data']);
  }
  
  @override
  Future<UserModel> getCurrentUser() async {
    final response = await _client.get('/users/me');
    return UserModel.fromJson(response.data['data']);
  }
  
  @override
  Future<UserModel> updateProfile(UpdateProfileParams params) async {
    final response = await _client.patch('/users/me', data: params.toJson());
    return UserModel.fromJson(response.data['data']);
  }
  
  @override
  Future<FollowResultModel> followUser(String userId) async {
    final response = await _client.post('/users/$userId/follow');
    return FollowResultModel.fromJson(response.data['data']);
  }
  
  @override
  Future<void> unfollowUser(String userId) async {
    await _client.delete('/users/$userId/follow');
  }
}
```

### Repository Implementation

```dart
// data/repositories/user_repository_impl.dart

class UserRepositoryImpl implements UserRepository {
  final UserRemoteDatasource _remoteDatasource;
  final NetworkInfo _networkInfo;
  
  UserRepositoryImpl(this._remoteDatasource, this._networkInfo);
  
  @override
  Future<Either<Failure, User>> getUser(String userId) async {
    if (!await _networkInfo.isConnected) {
      return Left(NetworkFailure('No internet connection'));
    }
    
    try {
      final user = await _remoteDatasource.getUser(userId);
      return Right(user);
    } on DioException catch (e) {
      return Left(_handleDioError(e));
    } catch (e) {
      return Left(UnknownFailure(e.toString()));
    }
  }
  
  @override
  Future<Either<Failure, FollowResult>> followUser(String userId) async {
    if (!await _networkInfo.isConnected) {
      return Left(NetworkFailure('No internet connection'));
    }
    
    try {
      final result = await _remoteDatasource.followUser(userId);
      return Right(result);
    } on DioException catch (e) {
      return Left(_handleDioError(e));
    } catch (e) {
      return Left(UnknownFailure(e.toString()));
    }
  }
  
  Failure _handleDioError(DioException e) {
    if (e.response != null) {
      final data = e.response!.data;
      final code = data['error']?['code'] ?? 'UNKNOWN_ERROR';
      final message = data['error']?['message'] ?? 'An error occurred';
      
      switch (e.response!.statusCode) {
        case 401:
          return AuthFailure(message);
        case 403:
          return ForbiddenFailure(message);
        case 404:
          return NotFoundFailure(message);
        case 429:
          return RateLimitFailure(message);
        default:
          return ServerFailure(message, code: code);
      }
    }
    
    if (e.type == DioExceptionType.connectionTimeout) {
      return NetworkFailure('Connection timeout');
    }
    
    return NetworkFailure('Network error');
  }
}
```

---

## Services

### Feature Flag Service

```dart
class FeatureFlagServiceImpl implements FeatureFlagService {
  final ApiClient _client;
  
  Map<String, bool> _flags = {};
  List<String> _premiumFeatures = [];
  Map<String, String> _userSettingKeys = {};
  
  FeatureFlagServiceImpl(this._client);
  
  @override
  Future<void> load() async {
    try {
      final response = await _client.get('/config');
      final data = response.data['data'];
      
      _flags = Map<String, bool>.from(data['features']);
      _premiumFeatures = List<String>.from(data['premiumFeatures']);
      _userSettingKeys = Map<String, String>.from(data['userSettingKeys'] ?? {});
    } catch (e) {
      // Use defaults on error
    }
  }
  
  @override
  bool isEnabled(String key) {
    return _flags[key] ?? false;
  }
  
  @override
  bool isPremiumFeature(String key) {
    return _premiumFeatures.contains(key);
  }
  
  @override
  bool canUseFeature(String key, User user) {
    if (!isEnabled(key)) return false;
    if (!isPremiumFeature(key)) return true;
    return user.isPremium;
  }
  
  @override
  String? getUserSettingKey(String flagKey) {
    return _userSettingKeys[flagKey];
  }
  
  @override
  bool hasUserSetting(String flagKey) {
    return _userSettingKeys.containsKey(flagKey);
  }
}
```

### Encryption Service

```dart
class EncryptionServiceImpl implements EncryptionService {
  final StorageService _storage;
  
  Uint8List? _privateKey;
  Uint8List? _publicKey;
  final Map<String, Uint8List> _publicKeyCache = {};
  
  EncryptionServiceImpl(this._storage);
  
  @override
  Future<void> init() async {
    // Load or generate key pair
    final storedPrivate = await _storage.read('private_key');
    final storedPublic = await _storage.read('public_key');
    
    if (storedPrivate != null && storedPublic != null) {
      _privateKey = base64Decode(storedPrivate);
      _publicKey = base64Decode(storedPublic);
    } else {
      await generateKeyPair();
    }
  }
  
  @override
  Future<void> generateKeyPair() async {
    final keyPair = X25519.generateKeyPair();
    _privateKey = keyPair.privateKey;
    _publicKey = keyPair.publicKey;
    
    await _storage.write('private_key', base64Encode(_privateKey!));
    await _storage.write('public_key', base64Encode(_publicKey!));
  }
  
  @override
  String get publicKeyBase64 => base64Encode(_publicKey!);
  
  @override
  EncryptedData encrypt(String plaintext, String recipientPublicKeyBase64) {
    final recipientPublicKey = base64Decode(recipientPublicKeyBase64);
    
    // Derive shared secret
    final sharedSecret = X25519.computeSharedSecret(_privateKey!, recipientPublicKey);
    
    // Generate nonce
    final nonce = _generateNonce();
    
    // Encrypt with AES-GCM
    final encrypted = AesGcm.encrypt(
      plaintext: utf8.encode(plaintext),
      key: sharedSecret,
      nonce: nonce,
    );
    
    return EncryptedData(
      content: base64Encode(encrypted),
      nonce: base64Encode(nonce),
      algorithm: 'x25519-aes256gcm',
    );
  }
  
  @override
  String decrypt(EncryptedData data, String senderPublicKeyBase64) {
    final senderPublicKey = base64Decode(senderPublicKeyBase64);
    
    // Derive shared secret
    final sharedSecret = X25519.computeSharedSecret(_privateKey!, senderPublicKey);
    
    // Decrypt with AES-GCM
    final decrypted = AesGcm.decrypt(
      ciphertext: base64Decode(data.content),
      key: sharedSecret,
      nonce: base64Decode(data.nonce),
    );
    
    return utf8.decode(decrypted);
  }
  
  Uint8List _generateNonce() {
    final random = Random.secure();
    return Uint8List.fromList(
      List.generate(12, (_) => random.nextInt(256)),
    );
  }
}
```

---

## Shared Widgets

### AppButton

```dart
// shared/widgets/buttons/app_button.dart

enum AppButtonSize { small, medium, large }
enum AppButtonVariant { primary, secondary, outline, text }

class AppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final AppButtonSize size;
  final AppButtonVariant variant;
  final IconData? icon;
  final bool isLoading;
  final bool isFullWidth;
  
  const AppButton({
    super.key,
    required this.label,
    this.onPressed,
    this.size = AppButtonSize.medium,
    this.variant = AppButtonVariant.primary,
    this.icon,
    this.isLoading = false,
    this.isFullWidth = false,
  });
  
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return SizedBox(
      width: isFullWidth ? double.infinity : null,
      height: _getHeight(),
      child: _buildButton(theme),
    );
  }
  
  double _getHeight() {
    switch (size) {
      case AppButtonSize.small: return 36;
      case AppButtonSize.medium: return 44;
      case AppButtonSize.large: return 52;
    }
  }
  
  Widget _buildButton(ThemeData theme) {
    final child = isLoading
        ? SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 18),
                const SizedBox(width: 8),
              ],
              Text(label),
            ],
          );
    
    switch (variant) {
      case AppButtonVariant.primary:
        return ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          child: child,
        );
      case AppButtonVariant.secondary:
        return ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: theme.colorScheme.secondaryContainer,
          ),
          child: child,
        );
      case AppButtonVariant.outline:
        return OutlinedButton(
          onPressed: isLoading ? null : onPressed,
          child: child,
        );
      case AppButtonVariant.text:
        return TextButton(
          onPressed: isLoading ? null : onPressed,
          child: child,
        );
    }
  }
}
```

---

## Testing

### Unit Test Example

```dart
// test/features/feed/domain/usecases/get_home_feed_test.dart

void main() {
  late GetHomeFeedUseCase usecase;
  late MockFeedRepository mockRepository;
  
  setUp(() {
    mockRepository = MockFeedRepository();
    usecase = GetHomeFeedUseCase(mockRepository);
  });
  
  group('GetHomeFeedUseCase', () {
    final tPosts = [
      Post(id: '1', content: 'Test 1'),
      Post(id: '2', content: 'Test 2'),
    ];
    final tResponse = FeedResponse(posts: tPosts, hasMore: true);
    
    test('should get feed from repository', () async {
      // Arrange
      when(() => mockRepository.getHomeFeed(cursor: any(named: 'cursor')))
          .thenAnswer((_) async => Right(tResponse));
      
      // Act
      final result = await usecase(cursor: null);
      
      // Assert
      expect(result, Right(tResponse));
      verify(() => mockRepository.getHomeFeed(cursor: null)).called(1);
    });
    
    test('should return failure when repository fails', () async {
      // Arrange
      when(() => mockRepository.getHomeFeed(cursor: any(named: 'cursor')))
          .thenAnswer((_) async => Left(ServerFailure('Error')));
      
      // Act
      final result = await usecase(cursor: null);
      
      // Assert
      expect(result, Left(ServerFailure('Error')));
    });
  });
}
```

### Widget Test Example

```dart
// test/features/chat/presentation/widgets/message_bubble_test.dart

void main() {
  group('MessageBubble', () {
    testWidgets('renders text message correctly', (tester) async {
      final message = Message(
        id: '1',
        content: 'Hello World',
        senderId: 'user_123',
        createdAt: DateTime.now(),
      );
      
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: MessageBubble(
              message: message,
              isMe: true,
              showAvatar: false,
            ),
          ),
        ),
      );
      
      expect(find.text('Hello World'), findsOneWidget);
    });
    
    testWidgets('shows avatar when showAvatar is true', (tester) async {
      final message = Message(
        id: '1',
        content: 'Hello',
        senderId: 'user_456',
        createdAt: DateTime.now(),
      );
      
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: MessageBubble(
              message: message,
              isMe: false,
              showAvatar: true,
            ),
          ),
        ),
      );
      
      expect(find.byType(CircleAvatar), findsOneWidget);
    });
  });
}
```

---

## Packages (pubspec.yaml)

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  flutter_bloc: ^8.1.3
  equatable: ^2.0.5
  
  # DI
  get_it: ^7.6.4
  injectable: ^2.3.2
  
  # Network
  dio: ^5.4.0
  connectivity_plus: ^5.0.2
  
  # Navigation
  go_router: ^13.0.1
  
  # Storage
  sqflite: ^2.3.0
  flutter_secure_storage: ^9.0.0
  shared_preferences: ^2.2.2
  
  # WebSocket
  socket_io_client: ^2.0.3+1
  
  # Crypto
  cryptography: ^2.7.0
  
  # UI
  cached_network_image: ^3.3.0
  shimmer: ^3.0.0
  flutter_svg: ^2.0.9
  
  # Utils
  intl: ^0.18.1
  uuid: ^4.2.1
  dartz: ^0.10.1
  rxdart: ^0.27.7
  
  # Firebase
  firebase_core: ^2.24.2
  firebase_messaging: ^14.7.10
  
  # Media
  image_picker: ^1.0.5
  video_player: ^2.8.2

dev_dependencies:
  flutter_test:
    sdk: flutter
  
  # Testing
  bloc_test: ^9.1.5
  mocktail: ^1.0.1
  
  # Code generation
  build_runner: ^2.4.7
  injectable_generator: ^2.4.1
  
  # Linting
  flutter_lints: ^3.0.1
```
