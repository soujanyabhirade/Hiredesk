import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { JwtService } from '@nestjs/jwt';

// Mock the AuthService module so Jest does NOT load the real service.
// This prevents Prisma / @prisma/orm-postgres from being loaded.
jest.mock('./auth.service', () => ({
  AuthService: class AuthService {},
}));

describe('AuthController', () => {
  let controller: AuthController;

  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    getGoogleAuthorizationUrl: jest.fn(),
    loginWithGoogle: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: JwtAuthGuard,
          useValue: { canActivate: jest.fn().mockReturnValue(true) },
        },
        {
          provide: JwtService,
          useValue: { verifyAsync: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call authService.register', async () => {
    const dto = {
      email: 'test@example.com',
      password: 'password123',
    };

    authService.register.mockResolvedValue({
      id: 1,
      email: dto.email,
    });

    const result = await controller.register(dto);

    expect(result).toEqual({
      id: 1,
      email: dto.email,
    });

    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('should call authService.login', async () => {
    const dto = {
      email: 'test@example.com',
      password: 'password123',
    };

    authService.login.mockResolvedValue({
      access_token: 'test-jwt-token',
    });

    const result = await controller.login(dto);

    expect(result).toEqual({
      access_token: 'test-jwt-token',
    });

    expect(authService.login).toHaveBeenCalledWith(dto);
  });

  it('should return the Google authorization URL', () => {
    authService.getGoogleAuthorizationUrl.mockReturnValue(
      'https://accounts.google.com/oauth',
    );

    expect(controller.google()).toEqual({
      authorization_url: 'https://accounts.google.com/oauth',
    });
  });

  it('should exchange a Google callback for application tokens', async () => {
    authService.loginWithGoogle.mockResolvedValue({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    });

    const result = await controller.googleCallback(
      'authorization-code',
      'signed-state',
    );

    expect(result).toEqual({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    });
    expect(authService.loginWithGoogle).toHaveBeenCalledWith(
      'authorization-code',
      'signed-state',
    );
  });
});