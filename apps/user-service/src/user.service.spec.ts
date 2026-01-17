import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from './user.service';
import { User, UserDocument } from './schemas/user.schema';
import { Follow, FollowDocument } from './schemas/follow.schema';

// Mock için tip tanımlamaları
type MockModel<T> = Partial<Record<keyof Model<T>, jest.Mock>>;

const mockUserModel = (): MockModel<UserDocument> => ({
  findById: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
  updateOne: jest.fn(),
});

const mockFollowModel = (): MockModel<FollowDocument> => ({
  find: jest.fn(),
  findOne: jest.fn(),
});

const mockRedisService = {
  get: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
};

const mockLoggerService = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

describe('UserService', () => {
  let service: UserService;
  let userModel: MockModel<UserDocument>;
  let followModel: MockModel<FollowDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel(),
        },
        {
          provide: getModelToken(Follow.name),
          useValue: mockFollowModel(),
        },
        {
          provide: 'RedisService',
          useValue: mockRedisService,
        },
        {
          provide: 'LoggerService',
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userModel = module.get(getModelToken(User.name));
    followModel = module.get(getModelToken(Follow.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('cache\'den kullanıcı döndürmeli', async () => {
      const mockUser = {
        _id: 'user_123',
        username: 'testuser',
        displayName: 'Test User',
      };

      mockRedisService.get.mockResolvedValue(JSON.stringify(mockUser));

      const result = await service.findById('user_123');

      expect(result).toEqual(mockUser);
      expect(mockRedisService.get).toHaveBeenCalledWith('user:user_123');
      expect(userModel.findById).not.toHaveBeenCalled();
    });

    it('cache boşsa veritabanından getirmeli', async () => {
      const mockUser = {
        _id: 'user_123',
        username: 'testuser',
        displayName: 'Test User',
      };

      mockRedisService.get.mockResolvedValue(null);
      userModel.findById!.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findById('user_123');

      expect(result).toEqual(mockUser);
      expect(mockRedisService.get).toHaveBeenCalledWith('user:user_123');
      expect(userModel.findById).toHaveBeenCalledWith('user_123');
      expect(mockRedisService.setex).toHaveBeenCalled();
    });

    it('kullanıcı bulunamazsa null döndürmeli', async () => {
      mockRedisService.get.mockResolvedValue(null);
      userModel.findById!.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('kullanıcı adı ile kullanıcı bulmalı', async () => {
      const mockUser = {
        _id: 'user_123',
        username: 'testuser',
        displayName: 'Test User',
      };

      userModel.findOne!.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findByUsername('testuser');

      expect(result).toEqual(mockUser);
      expect(userModel.findOne).toHaveBeenCalledWith({ username: 'testuser' });
    });

    it('büyük harfli kullanıcı adını küçük harfe çevirmeli', async () => {
      userModel.findOne!.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await service.findByUsername('TestUser');

      expect(userModel.findOne).toHaveBeenCalledWith({ username: 'testuser' });
    });
  });

  describe('exists', () => {
    it('kullanıcı varsa true döndürmeli', async () => {
      userModel.countDocuments!.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.exists('user_123');

      expect(result).toBe(true);
    });

    it('kullanıcı yoksa false döndürmeli', async () => {
      userModel.countDocuments!.mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      const result = await service.exists('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('isUsernameAvailable', () => {
    it('kullanıcı adı müsaitse true döndürmeli', async () => {
      userModel.countDocuments!.mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      const result = await service.isUsernameAvailable('newusername');

      expect(result).toBe(true);
    });

    it('kullanıcı adı alınmışsa false döndürmeli', async () => {
      userModel.countDocuments!.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.isUsernameAvailable('takenusername');

      expect(result).toBe(false);
    });
  });

  describe('updateStats', () => {
    it('istatistikleri güncellemeli', async () => {
      userModel.updateOne!.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      });

      await service.updateStats('user_123', 'followersCount', 1);

      expect(userModel.updateOne).toHaveBeenCalled();
      expect(mockRedisService.del).toHaveBeenCalledWith('user:user_123');
    });
  });

  describe('invalidateCache', () => {
    it('tüm ilgili cache\'leri temizlemeli', async () => {
      mockRedisService.del.mockResolvedValue(1);

      await service.invalidateCache('user_123');

      expect(mockRedisService.del).toHaveBeenCalledTimes(4);
      expect(mockRedisService.del).toHaveBeenCalledWith('user:user_123');
      expect(mockRedisService.del).toHaveBeenCalledWith('user:user_123:settings');
      expect(mockRedisService.del).toHaveBeenCalledWith('following:user_123');
      expect(mockRedisService.del).toHaveBeenCalledWith('followers:user_123');
    });
  });
});
