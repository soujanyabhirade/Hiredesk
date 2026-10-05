import { ServiceUnavailableException } from '@nestjs/common';
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

jest.mock('./firebase-admin.js', () => ({
  getFirebaseMessaging: jest.fn(),
}));

import { db } from '../prisma/db.js';
import { getFirebaseMessaging } from './firebase-admin.js';

describe('NotificationsService', () => {
  let service: NotificationsService;

  let updateMock: jest.Mock;

  let allTokensMock: jest.Mock;

  let deleteMock: jest.Mock;

  let sendEachForMulticast: jest.Mock;

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

    allTokensMock = jest.fn().mockResolvedValue([]);

    deleteMock = jest.fn().mockResolvedValue({});

    sendEachForMulticast = jest.fn().mockResolvedValue({ responses: [] });

    (getFirebaseMessaging as jest.Mock).mockReturnValue({
      sendEachForMulticast,
    });

    (db.orm.public.PushToken.where as jest.Mock).mockReturnValue({
      update: updateMock,
      all: allTokensMock,
      delete: deleteMock,
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

  describe('sendToUser', () => {
    const storedToken = (value: string, id: number) => ({
      id,
      userId: 7,
      token: value,
      platform: 'web',
      createdAt: '2026-10-05T10:00:00Z',
      updatedAt: '2026-10-05T10:00:00Z',
    });

    const failure = (code: string) => ({
      success: false,
      error: Object.assign(new Error(code), { code }),
    });

    it('sends to every token owned by the user', async () => {
      allTokensMock.mockResolvedValue([
        storedToken('token-a', 1),
        storedToken('token-b', 2),
      ]);

      sendEachForMulticast.mockResolvedValue({
        responses: [{ success: true }, { success: true }],
      });

      const result = await service.sendToUser(7, 'Interview', 'At 3pm');

      expect(sendEachForMulticast).toHaveBeenCalledWith({
        tokens: ['token-a', 'token-b'],
        notification: {
          title: 'Interview',
          body: 'At 3pm',
        },
      });
      expect(result).toEqual({ sent: 2, failed: 0, pruned: 0 });
      expect(deleteMock).not.toHaveBeenCalled();
    });

    it('returns 0/0/0 when the user has no tokens', async () => {
      allTokensMock.mockResolvedValue([]);

      const result = await service.sendToUser(7, 'Interview', 'At 3pm');

      expect(result).toEqual({ sent: 0, failed: 0, pruned: 0 });
      expect(sendEachForMulticast).not.toHaveBeenCalled();
    });

    it('deletes a token FCM reports as not registered', async () => {
      allTokensMock.mockResolvedValue([
        storedToken('token-a', 1),
        storedToken('token-b', 2),
      ]);

      sendEachForMulticast.mockResolvedValue({
        responses: [
          { success: true },
          failure('messaging/registration-token-not-registered'),
        ],
      });

      const result = await service.sendToUser(7, 'Interview', 'At 3pm');

      expect(db.orm.public.PushToken.where).toHaveBeenCalledWith({
        token: 'token-b',
      });
      expect(deleteMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ sent: 1, failed: 1, pruned: 1 });
    });

    it('deletes a token FCM reports as an invalid argument', async () => {
      allTokensMock.mockResolvedValue([storedToken('token-a', 1)]);

      sendEachForMulticast.mockResolvedValue({
        responses: [failure('messaging/invalid-argument')],
      });

      const result = await service.sendToUser(7, 'Interview', 'At 3pm');

      expect(deleteMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ sent: 0, failed: 1, pruned: 1 });
    });

    it('keeps the token when the failure is transient', async () => {
      allTokensMock.mockResolvedValue([
        storedToken('token-a', 1),
        storedToken('token-b', 2),
      ]);

      sendEachForMulticast.mockResolvedValue({
        responses: [
          failure('messaging/internal-error'),
          failure('messaging/quota-exceeded'),
        ],
      });

      const result = await service.sendToUser(7, 'Interview', 'At 3pm');

      expect(deleteMock).not.toHaveBeenCalled();
      expect(result).toEqual({ sent: 0, failed: 2, pruned: 0 });
    });

    it('uses only the requested user id', async () => {
      allTokensMock.mockResolvedValue([storedToken('token-a', 1)]);

      sendEachForMulticast.mockResolvedValue({
        responses: [{ success: true }],
      });

      await service.sendToUser(7, 'Interview', 'At 3pm');

      expect(db.orm.public.PushToken.where).toHaveBeenCalledWith({
        userId: 7,
      });
      expect(db.orm.public.PushToken.where).not.toHaveBeenCalledWith(
        expect.objectContaining({ userId: 99 }),
      );
    });

    it('propagates ServiceUnavailableException when Firebase is unconfigured', async () => {
      allTokensMock.mockResolvedValue([storedToken('token-a', 1)]);

      const unconfigured = new ServiceUnavailableException(
        'Push notification delivery is not configured.',
      );

      (getFirebaseMessaging as jest.Mock).mockImplementation(() => {
        throw unconfigured;
      });

      await expect(
        service.sendToUser(7, 'Interview', 'At 3pm'),
      ).rejects.toBe(unconfigured);
      expect(sendEachForMulticast).not.toHaveBeenCalled();
      expect(deleteMock).not.toHaveBeenCalled();
    });
  });
});