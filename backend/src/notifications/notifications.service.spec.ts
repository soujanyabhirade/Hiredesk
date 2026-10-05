import { Test, TestingModule } from '@nestjs/testing';

import { NotificationsService } from './notifications.service.js';

jest.mock('../prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        PushToken: {
          create: jest.fn(),
          first: jest.fn(),
          where: jest.fn(),
        },
      },
    },
  },
}));

import { db } from '../prisma/db.js';

describe('NotificationsService', () => {
  let service: NotificationsService;

  let updateMock: jest.Mock;

  const token = 'fcm-registration-token-value';

  const record = {
    id: 5,
    userId: 7,
    token,
    platform: 'web',
    createdAt: '2026-10-05T10:00:00Z',
    updatedAt: '2026-10-05T10:00:00Z',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    updateMock = jest.fn().mockResolvedValue({});

    (db.orm.public.PushToken.where as jest.Mock).mockReturnValue({
      update: updateMock,
    });

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [NotificationsService],
      }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('subscribe', () => {
    it('creates the token when it does not exist yet', async () => {
      (db.orm.public.PushToken.first as jest.Mock).mockResolvedValue(null);
      (db.orm.public.PushToken.create as jest.Mock).mockResolvedValue(record);

      const result = await service.subscribe({ token, platform: 'web' }, 7);

      expect(db.orm.public.PushToken.first).toHaveBeenCalledWith({ token });
      expect(db.orm.public.PushToken.create).toHaveBeenCalledWith({
        token,
        platform: 'web',
        userId: 7,
      });
      expect(result).toEqual({
        id: 5,
        platform: 'web',
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      });
    });

    it('defaults the platform to web when omitted', async () => {
      (db.orm.public.PushToken.first as jest.Mock).mockResolvedValue(null);
      (db.orm.public.PushToken.create as jest.Mock).mockResolvedValue({
        ...record,
        platform: 'web',
      });

      await service.subscribe({ token }, 7);

      expect(db.orm.public.PushToken.create).toHaveBeenCalledWith({
        token,
        platform: 'web',
        userId: 7,
      });
    });

    it('refreshes updatedAt instead of duplicating when the same user resubscribes', async () => {
      (db.orm.public.PushToken.first as jest.Mock)
        .mockResolvedValueOnce(record)
        .mockResolvedValueOnce({ ...record, updatedAt: '2026-10-05T12:00:00Z' });

      const result = await service.subscribe({ token, platform: 'web' }, 7);

      expect(db.orm.public.PushToken.create).not.toHaveBeenCalled();
      expect(db.orm.public.PushToken.where).toHaveBeenCalledWith({ id: 5 });
      expect(updateMock).toHaveBeenCalledWith({ userId: 7, platform: 'web' });
      expect(result.updatedAt).toBe('2026-10-05T12:00:00Z');
    });

    it('reassigns a token that currently belongs to another user', async () => {
      (db.orm.public.PushToken.first as jest.Mock)
        .mockResolvedValueOnce({ ...record, userId: 99 })
        .mockResolvedValueOnce({ ...record, userId: 7 });

      await service.subscribe({ token, platform: 'web' }, 7);

      expect(db.orm.public.PushToken.create).not.toHaveBeenCalled();
      expect(updateMock).toHaveBeenCalledWith({ userId: 7, platform: 'web' });
    });

    it('never takes the user id from the payload', async () => {
      (db.orm.public.PushToken.first as jest.Mock).mockResolvedValue(null);
      (db.orm.public.PushToken.create as jest.Mock).mockResolvedValue(record);

      await service.subscribe(
        { token, platform: 'web', userId: 99 } as never,
        7,
      );

      expect(db.orm.public.PushToken.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 7 }),
      );
    });
  });

  describe('concurrent subscribe for the same token', () => {
    it('adopts the winning row when the insert violates the unique constraint', async () => {
      const uniqueViolation = Object.assign(
        new Error('duplicate key value violates unique constraint'),
        { code: '23505' },
      );

      (db.orm.public.PushToken.first as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...record, userId: 99 })
        .mockResolvedValueOnce({ ...record, userId: 7 });

      (db.orm.public.PushToken.create as jest.Mock).mockRejectedValue(
        uniqueViolation,
      );

      const result = await service.subscribe({ token, platform: 'web' }, 7);

      expect(updateMock).toHaveBeenCalledWith({ userId: 7, platform: 'web' });
      expect(result.id).toBe(5);
    });

    it('detects a unique violation wrapped on cause', async () => {
      const wrapped = Object.assign(new Error('query failed'), {
        code: 'DRIVER.QUERY_ERROR',
        cause: Object.assign(new Error('duplicate key'), { code: '23505' }),
      });

      (db.orm.public.PushToken.first as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(record)
        .mockResolvedValueOnce(record);

      (db.orm.public.PushToken.create as jest.Mock).mockRejectedValue(wrapped);

      await service.subscribe({ token, platform: 'web' }, 7);

      expect(updateMock).toHaveBeenCalledWith({ userId: 7, platform: 'web' });
    });

    it('rethrows the original error when the token cannot be re-read', async () => {
      const uniqueViolation = Object.assign(new Error('duplicate key'), {
        code: '23505',
      });

      (db.orm.public.PushToken.first as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      (db.orm.public.PushToken.create as jest.Mock).mockRejectedValue(
        uniqueViolation,
      );

      await expect(
        service.subscribe({ token, platform: 'web' }, 7),
      ).rejects.toBe(uniqueViolation);
    });

    it('propagates database errors that are not unique violations', async () => {
      const failure = Object.assign(new Error('connection terminated'), {
        code: 'ECONNRESET',
      });

      (db.orm.public.PushToken.first as jest.Mock).mockResolvedValue(null);
      (db.orm.public.PushToken.create as jest.Mock).mockRejectedValue(failure);

      await expect(
        service.subscribe({ token, platform: 'web' }, 7),
      ).rejects.toBe(failure);
      expect(updateMock).not.toHaveBeenCalled();
    });
  });
});