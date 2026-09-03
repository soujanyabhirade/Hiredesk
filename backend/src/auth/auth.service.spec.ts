import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { AuthService } from './auth.service.js';
import { db } from '../prisma/db.js';

/*
 * Mock the database.
 *
 * AuthService uses:
 *
 * db.orm.public.User.first()
 * db.orm.public.User.create()
 */
jest.mock('../prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        User: {
          first: jest.fn(),
          create: jest.fn(),
        },
      },
    },
  },
}));

/*
 * Mock bcrypt so these tests don't depend on real password hashing.
 */
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashed-password',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const hashedPassword = 'hashed-password';

      (db.orm.public.User.first as jest.Mock).mockResolvedValue(null);

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      (db.orm.public.User.create as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: dto.email,
        password: hashedPassword,
      });

      const result = await service.register(dto);

      expect(db.orm.public.User.first).toHaveBeenCalledWith({
        email: dto.email,
      });

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);

      expect(db.orm.public.User.create).toHaveBeenCalledWith({
        email: dto.email,
        password: hashedPassword,
      });

      expect(result).toEqual({
        id: 'user-123',
        email: dto.email,
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      const dto = {
        email: 'existing@example.com',
        password: 'password123',
      };

      (db.orm.public.User.first as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.register(dto)).rejects.toThrow(
        ConflictException,
      );

      await expect(service.register(dto)).rejects.toThrow(
        'Email already registered',
      );

      expect(db.orm.public.User.first).toHaveBeenCalledWith({
        email: dto.email,
      });

      expect(bcrypt.hash).not.toHaveBeenCalled();

      expect(db.orm.public.User.create).not.toHaveBeenCalled();
    });

    it('should return only id and email after registration', async () => {
      const dto = {
        email: 'new@example.com',
        password: 'password123',
      };

      (db.orm.public.User.first as jest.Mock).mockResolvedValue(null);

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      (db.orm.public.User.create as jest.Mock).mockResolvedValue({
        id: 'user-456',
        email: dto.email,
        password: 'hashed-password',
      });

      const result = await service.register(dto);

      expect(result).toEqual({
        id: 'user-456',
        email: dto.email,
      });

      expect(result).not.toHaveProperty('password');
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const accessToken = 'jwt-access-token';

      (db.orm.public.User.first as jest.Mock).mockResolvedValue(mockUser);

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      mockJwtService.signAsync.mockResolvedValue(accessToken);

      const result = await service.login(dto);

      expect(db.orm.public.User.first).toHaveBeenCalledWith({
        email: dto.email,
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(
        dto.password,
        mockUser.password,
      );

      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });

      expect(result).toEqual({
        access_token: accessToken,
      });
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      const dto = {
        email: 'notfound@example.com',
        password: 'password123',
      };

      (db.orm.public.User.first as jest.Mock).mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(
        UnauthorizedException,
      );

      await expect(service.login(dto)).rejects.toThrow(
        'Invalid email or password',
      );

      expect(db.orm.public.User.first).toHaveBeenCalledWith({
        email: dto.email,
      });

      expect(bcrypt.compare).not.toHaveBeenCalled();

      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      (db.orm.public.User.first as jest.Mock).mockResolvedValue(mockUser);

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(
        UnauthorizedException,
      );

      await expect(service.login(dto)).rejects.toThrow(
        'Invalid email or password',
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        dto.password,
        mockUser.password,
      );

      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should return access_token after successful login', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'password123',
      };

      (db.orm.public.User.first as jest.Mock).mockResolvedValue(mockUser);

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      mockJwtService.signAsync.mockResolvedValue('my-jwt-token');

      const result = await service.login(dto);

      expect(result.access_token).toBe('my-jwt-token');
    });
  });
});