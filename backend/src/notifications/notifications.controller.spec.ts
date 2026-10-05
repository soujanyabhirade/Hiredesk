import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../auth/decorators/roles.decorator.js';

import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

// The real module opens a Postgres client on import, so the controller spec
// never loads it.
jest.mock('../prisma/db.js', () => ({
  db: {
    orm: {
      public: {},
    },
  },
}));

describe('NotificationsController', () => {
  let controller: NotificationsController;

  const notificationsService = {
    subscribe: jest.fn(),
    sendToUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    notificationsService.subscribe.mockResolvedValue({ id: 5 });
    notificationsService.sendToUser.mockResolvedValue({
      sent: 1,
      failed: 0,
      pruned: 0,
    });

    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [NotificationsController],
        providers: [
          {
            provide: NotificationsService,
            useValue: notificationsService,
          },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({
          canActivate: jest.fn().mockReturnValue(true),
        })
        .overrideGuard(RolesGuard)
        .useValue({
          canActivate: jest.fn().mockReturnValue(true),
        })
        .compile();

    controller = module.get<NotificationsController>(
      NotificationsController,
    );
  });

  const adminRequest = {
    user: { sub: 7, email: 'admin@example.test', role: 'ADMIN' },
  };

  it('is protected by the JWT and roles guards', () => {
    const guards = Reflect.getMetadata(
      '__guards__',
      NotificationsController,
    ) as unknown[];

    expect(guards).toEqual([JwtAuthGuard, RolesGuard]);
  });

  describe('POST /notifications/test', () => {
    it('is restricted to administrators', () => {
      const roles = Reflect.getMetadata(
        ROLES_KEY,
        NotificationsController.prototype.sendTestNotification,
      );

      expect(roles).toEqual(['ADMIN']);
    });

    it('delegates to the service with the verified subject', async () => {
      const result = await controller.sendTestNotification(
        { title: 'Interview', body: 'At 3pm' },
        adminRequest,
      );

      expect(notificationsService.sendToUser).toHaveBeenCalledWith(
        7,
        'Interview',
        'At 3pm',
      );
      expect(result).toEqual({ sent: 1, failed: 0, pruned: 0 });
    });

    it('falls back to a default title and body', async () => {
      await controller.sendTestNotification({}, adminRequest);

      expect(notificationsService.sendToUser).toHaveBeenCalledWith(
        7,
        expect.stringContaining('HireDesk'),
        expect.stringContaining('Firebase Cloud Messaging'),
      );
    });

    it('never forwards a client-supplied user id', async () => {
      await controller.sendTestNotification(
        { title: 'Interview', body: 'At 3pm', userId: 99 } as never,
        adminRequest,
      );

      const [recipient] = notificationsService.sendToUser.mock
        .calls[0] as [number, string, string];

      expect(recipient).toBe(7);
      expect(
        notificationsService.sendToUser.mock.calls[0],
      ).not.toContain(99);
    });

    it('sends to the caller and not to the requested id', async () => {
      const recruiterRequest = {
        user: { sub: 42, email: 'r@example.test', role: 'RECRUITER' },
      };

      await controller.sendTestNotification({}, recruiterRequest);

      expect(notificationsService.sendToUser).toHaveBeenCalledWith(
        42,
        expect.any(String),
        expect.any(String),
      );
    });
  });

  describe('POST /notifications/subscribe', () => {
    it('stays open to every authenticated role', () => {
      const roles = Reflect.getMetadata(
        ROLES_KEY,
        NotificationsController.prototype.subscribe,
      );

      expect(roles).toBeUndefined();
    });

    it('subscribes the verified subject', async () => {
      await controller.subscribe(
        { token: 'fcm-registration-token-value', platform: 'web' },
        adminRequest,
      );

      expect(notificationsService.subscribe).toHaveBeenCalledWith(
        { token: 'fcm-registration-token-value', platform: 'web' },
        7,
      );
    });
  });
});
