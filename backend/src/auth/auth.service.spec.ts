import { AuthService } from './auth.service.js';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('../prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        User: {
          first: jest.fn(),
          create: jest.fn(),
          where: jest.fn(),
        },
      },
    },
  },
}));

import * as bcrypt from 'bcryptjs';
import { db } from '../prisma/db.js';

describe('AuthService', () => {
  let service: AuthService;

  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  beforeEach(() => {
    service = new AuthService(jwtService as any);

    jest.clearAllMocks();

    (
      db.orm.public.User.where as jest.Mock
    ).mockReturnValue({
      update: jest.fn().mockResolvedValue({}),
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      (
        db.orm.public.User.first as jest.Mock
      ).mockResolvedValue(null);

      (
        bcrypt.hash as jest.Mock
      ).mockResolvedValue('hashed-password');

      (
        db.orm.public.User.create as jest.Mock
      ).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'MENTOR',
      });

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith(
        'password123',
        10,
      );

      expect(db.orm.public.User.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'hashed-password',
      });
    });

    it('should reject an already registered email', async () => {
      (
        db.orm.public.User.first as jest.Mock
      ).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
      });

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      (
        db.orm.public.User.first as jest.Mock
      ).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'MENTOR',
      });

      (
        bcrypt.compare as jest.Mock
      ).mockResolvedValue(true);

      (
        bcrypt.hash as jest.Mock
      ).mockResolvedValue('hashed-refresh-token');

      (
        jwtService.signAsync as jest.Mock
      )
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashed-password',
      );

      expect(bcrypt.hash).toHaveBeenCalledWith(
        'refresh-token',
        10,
      );

      expect(
        db.orm.public.User.where,
      ).toHaveBeenCalledWith({
        id: 1,
      });

      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        {
          sub: 1,
          email: 'test@example.com',
          role: 'MENTOR',
        },
      );

      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        {
          sub: 1,
          email: 'test@example.com',
          role: 'MENTOR',
        },
        {
          expiresIn: '7d',
        },
      );
    });

    it('should reject an unknown user', async () => {
      (
        db.orm.public.User.first as jest.Mock
      ).mockResolvedValue(null);

      await expect(
        service.login({
          email: 'unknown@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow('Invalid email or password');
    });

    it('should reject an incorrect password', async () => {
      (
        db.orm.public.User.first as jest.Mock
      ).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'MENTOR',
      });

      (
        bcrypt.compare as jest.Mock
      ).mockResolvedValue(false);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('refresh', () => {
    it('should rotate the refresh token and return new tokens', async () => {
      (
        jwtService.verifyAsync as jest.Mock
      ).mockResolvedValue({
        sub: 1,
        email: 'test@example.com',
        role: 'MENTOR',
      });

      (
        db.orm.public.User.first as jest.Mock
      ).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        refreshTokenHash: 'hashed-refresh-token',
        role: 'MENTOR',
      });

      (
        bcrypt.compare as jest.Mock
      ).mockResolvedValue(true);

      (
        bcrypt.hash as jest.Mock
      ).mockResolvedValue('new-hashed-refresh-token');

      (
        jwtService.signAsync as jest.Mock
      )
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      const result = await service.refresh('refresh-token');

      expect(result).toEqual({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      });

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(
        'refresh-token',
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'refresh-token',
        'hashed-refresh-token',
      );

      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        {
          sub: 1,
          email: 'test@example.com',
          role: 'MENTOR',
        },
      );

      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        {
          sub: 1,
          email: 'test@example.com',
          role: 'MENTOR',
        },
        {
          expiresIn: '7d',
        },
      );

      expect(bcrypt.hash).toHaveBeenCalledWith(
        'new-refresh-token',
        10,
      );

      expect(
        db.orm.public.User.where,
      ).toHaveBeenCalledWith({
        id: 1,
      });
    });

    it('should reject an invalid refresh token', async () => {
      (
        jwtService.verifyAsync as jest.Mock
      ).mockRejectedValue(
        new Error('Invalid token'),
      );

      await expect(
        service.refresh('invalid-token'),
      ).rejects.toThrow('Invalid refresh token');
    });

    it('should reject a refresh token that does not match the stored hash', async () => {
      (
        jwtService.verifyAsync as jest.Mock
      ).mockResolvedValue({
        sub: 1,
        email: 'test@example.com',
        role: 'MENTOR',
      });

      (
        db.orm.public.User.first as jest.Mock
      ).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        refreshTokenHash: 'hashed-refresh-token',
        role: 'MENTOR',
      });

      (
        bcrypt.compare as jest.Mock
      ).mockResolvedValue(false);

      await expect(
        service.refresh('wrong-refresh-token'),
      ).rejects.toThrow('Invalid refresh token');
    });
  });
});