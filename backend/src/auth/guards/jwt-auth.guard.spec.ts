import {
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard.js';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = {
      verifyAsync: jest.fn(),
    } as unknown as JwtService;

    guard = new JwtAuthGuard(jwtService);
  });

  function createExecutionContext(
    authorization?: string,
  ): ExecutionContext {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          headers: {
            authorization,
          },
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should reject a request without an authorization header', async () => {
    const context = createExecutionContext();

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException(
        'Authorization header is required',
      ),
    );
  });

  it('should reject an invalid authorization header', async () => {
    const context =
      createExecutionContext('Basic abc123');

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException(
        'Invalid authorization header',
      ),
    );
  });

  it('should reject a missing bearer token', async () => {
    const context =
      createExecutionContext('Bearer');

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException(
        'Invalid authorization header',
      ),
    );
  });

  it('should reject an invalid token', async () => {
    (
      jwtService.verifyAsync as jest.Mock
    ).mockRejectedValue(
      new Error('Invalid token'),
    );

    const context =
      createExecutionContext('Bearer invalid-token');

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException(
        'Invalid or expired token',
      ),
    );
  });

  it('should allow a valid token and attach the payload to the request', async () => {
    const payload = {
      sub: 1,
      email: 'mentor@example.com',
      role: 'MENTOR',
    };

    (
      jwtService.verifyAsync as jest.Mock
    ).mockResolvedValue(payload);

    const request = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    };

    const context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(
      true,
    );

    expect(request).toHaveProperty('user', payload);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith(
      'valid-token',
    );
  });
});