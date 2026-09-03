import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { db } from '../prisma/db';

jest.mock('../prisma/db', () => ({
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

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const jwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register a new user', async () => {
    (db.orm.public.User.first as jest.Mock).mockResolvedValue(null);

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

    (db.orm.public.User.create as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      password: 'hashed-password',
    });

    const result = await service.register({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result).toEqual({
      id: 1,
      email: 'test@example.com',
    });

    expect(db.orm.public.User.create).toHaveBeenCalled();
  });

  it('should reject registration if email already exists', async () => {
    (db.orm.public.User.first as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'test@example.com',
    });

    await expect(
      service.register({
        email: 'test@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should reject login for unknown user', async () => {
    (db.orm.public.User.first as jest.Mock).mockResolvedValue(null);

    await expect(
      service.login({
        email: 'unknown@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should return an access token for valid login', async () => {
    (db.orm.public.User.first as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      password: '$2a$10$example',
    });

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    jwtService.signAsync.mockResolvedValue('test-jwt-token');

    const result = await service.login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result).toEqual({
      access_token: 'test-jwt-token',
    });

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 1,
      email: 'test@example.com',
    });
  });
});