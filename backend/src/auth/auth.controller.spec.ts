import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

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
});