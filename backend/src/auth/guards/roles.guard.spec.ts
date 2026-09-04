import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard.js';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as Reflector;

    guard = new RolesGuard(reflector);
  });

  function createExecutionContext(user?: {
    sub: number;
    email: string;
    role?: string;
  }): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user,
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access when no roles are required', () => {
    (
      reflector.getAllAndOverride as jest.Mock
    ).mockReturnValue(undefined);

    const context = createExecutionContext({
      sub: 1,
      email: 'mentor@example.com',
      role: 'MENTOR',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow a user with the required role', () => {
    (
      reflector.getAllAndOverride as jest.Mock
    ).mockReturnValue(['ADMIN']);

    const context = createExecutionContext({
      sub: 1,
      email: 'admin@example.com',
      role: 'ADMIN',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject a user with the wrong role', () => {
    (
      reflector.getAllAndOverride as jest.Mock
    ).mockReturnValue(['ADMIN']);

    const context = createExecutionContext({
      sub: 1,
      email: 'mentor@example.com',
      role: 'MENTOR',
    });

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException('Insufficient permissions'),
    );
  });

  it('should reject a user without a role', () => {
    (
      reflector.getAllAndOverride as jest.Mock
    ).mockReturnValue(['ADMIN']);

    const context = createExecutionContext({
      sub: 1,
      email: 'user@example.com',
    });

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException('User role is required'),
    );
  });
});