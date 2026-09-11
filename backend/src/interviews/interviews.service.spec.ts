import {
  NotFoundException,
} from '@nestjs/common';

import { InterviewsService } from './interviews.service.js';

jest.mock('../prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        Interview: {
          create: jest.fn(),
          all: jest.fn(),
          first: jest.fn(),
          where: jest.fn(),
        },
        Candidate: {
          first: jest.fn(),
        },
      },
    },
  },
}));

import { db } from '../prisma/db.js';

describe('InterviewsService', () => {
  let service: InterviewsService;

  beforeEach(() => {
    service = new InterviewsService();

    jest.clearAllMocks();

    (
      db.orm.public.Candidate.first as jest.Mock
    ).mockResolvedValue({ id: 1 });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // -------------------------------------------------------
  // CREATE
  // -------------------------------------------------------

  describe('create', () => {
    it('should create an interview using Prisma', async () => {
      const interview = {
        id: 1,
        candidateId: 1,
        scheduledAt: '2026-09-04T10:00:00Z',
        status: 'SCHEDULED',
        createdAt: '2026-09-04T09:00:00Z',
        updatedAt: '2026-09-04T09:00:00Z',
      };

      (
        db.orm.public.Interview.create as jest.Mock
      ).mockResolvedValue(interview);

      const result = await service.create({
        candidateId: 1,
        scheduledAt: '2026-09-04T10:00:00Z',
        status: 'SCHEDULED',
      });

      expect(result).toEqual(interview);

      expect(
        db.orm.public.Interview.create,
      ).toHaveBeenCalledWith({
        candidateId: 1,
        scheduledAt: '2026-09-04T10:00:00Z',
        status: 'SCHEDULED',
      });
    });

    it('should use the default status when status is not provided', async () => {
      const interview = {
        id: 2,
        candidateId: 1,
        scheduledAt: '2026-09-05T10:00:00Z',
        status: 'SCHEDULED',
      };

      (
        db.orm.public.Interview.create as jest.Mock
      ).mockResolvedValue(interview);

      const result = await service.create({
        candidateId: 1,
        scheduledAt: '2026-09-05T10:00:00Z',
      });

      expect(result).toEqual(interview);

      expect(
        db.orm.public.Interview.create,
      ).toHaveBeenCalledWith({
        candidateId: 1,
        scheduledAt: '2026-09-05T10:00:00Z',
      });
    });
  });

  // -------------------------------------------------------
  // FIND ALL
  // -------------------------------------------------------

  describe('findAll', () => {
    const interviews = [
      {
        id: 1,
        candidateId: 1,
        scheduledAt: '2026-09-04T10:00:00Z',
        status: 'SCHEDULED',
      },
      {
        id: 2,
        candidateId: 2,
        scheduledAt: '2026-09-06T10:00:00Z',
        status: 'COMPLETED',
      },
      {
        id: 3,
        candidateId: 3,
        scheduledAt: '2026-09-02T10:00:00Z',
        status: 'CANCELLED',
      },
    ];

    it('should return all interviews sorted by newest by default', async () => {
      (
        db.orm.public.Interview.all as jest.Mock
      ).mockResolvedValue(interviews);

      const result = await service.findAll();

      expect(result).toEqual([
        interviews[1],
        interviews[0],
        interviews[2],
      ]);

      expect(
        db.orm.public.Interview.all,
      ).toHaveBeenCalledTimes(1);
    });

    it('should return interviews sorted by newest explicitly', async () => {
      (
        db.orm.public.Interview.all as jest.Mock
      ).mockResolvedValue(interviews);

      const result = await service.findAll(
        undefined,
        'newest',
      );

      expect(result.map((item) => item.id)).toEqual([
        2,
        1,
        3,
      ]);
    });

    it('should filter interviews by status', async () => {
      (
        db.orm.public.Interview.all as jest.Mock
      ).mockResolvedValue(interviews);

      const result = await service.findAll(
        '  COMPLETED  ',
      );

      expect(result).toEqual([
        interviews[1],
      ]);
    });

    it('should perform status filtering case-insensitively', async () => {
      (
        db.orm.public.Interview.all as jest.Mock
      ).mockResolvedValue(interviews);

      const result = await service.findAll('scheduled');

      expect(result).toEqual([
        interviews[0],
      ]);
    });

    it('should return an empty array when no interviews match the status', async () => {
      (
        db.orm.public.Interview.all as jest.Mock
      ).mockResolvedValue(interviews);

      const result = await service.findAll('pending');

      expect(result).toEqual([]);
    });

    it('should sort interviews by oldest', async () => {
      (
        db.orm.public.Interview.all as jest.Mock
      ).mockResolvedValue(interviews);

      const result = await service.findAll(
        undefined,
        'oldest',
      );

      expect(result.map((item) => item.id)).toEqual([
        3,
        1,
        2,
      ]);
    });

    it('should sort interviews by status ascending', async () => {
      (
        db.orm.public.Interview.all as jest.Mock
      ).mockResolvedValue(interviews);

      const result = await service.findAll(
        undefined,
        'statusAsc',
      );

      expect(result.map((item) => item.status)).toEqual([
        'CANCELLED',
        'COMPLETED',
        'SCHEDULED',
      ]);
    });

    it('should trim the sort option', async () => {
      (
        db.orm.public.Interview.all as jest.Mock
      ).mockResolvedValue(interviews);

      const result = await service.findAll(
        undefined,
        '  oldest  ',
      );

      expect(result.map((item) => item.id)).toEqual([
        3,
        1,
        2,
      ]);
    });

    it('should fall back to newest sorting for an unknown sort option', async () => {
      (
        db.orm.public.Interview.all as jest.Mock
      ).mockResolvedValue(interviews);

      const result = await service.findAll(
        undefined,
        'invalidSort',
      );

      expect(result.map((item) => item.id)).toEqual([
        2,
        1,
        3,
      ]);
    });

    it('should apply status filtering before sorting', async () => {
      (
        db.orm.public.Interview.all as jest.Mock
      ).mockResolvedValue([
        {
          id: 1,
          candidateId: 1,
          scheduledAt: '2026-09-04T10:00:00Z',
          status: 'SCHEDULED',
        },
        {
          id: 2,
          candidateId: 2,
          scheduledAt: '2026-09-06T10:00:00Z',
          status: 'SCHEDULED',
        },
        {
          id: 3,
          candidateId: 3,
          scheduledAt: '2026-09-02T10:00:00Z',
          status: 'COMPLETED',
        },
      ]);

      const result = await service.findAll(
        'scheduled',
        'oldest',
      );

      expect(result.map((item) => item.id)).toEqual([
        1,
        2,
      ]);
    });
  });

  // -------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------

  describe('update', () => {
    it('should update an existing interview', async () => {
      const existingInterview = {
        id: 1,
        candidateId: 1,
        scheduledAt: '2026-09-04T10:00:00Z',
        status: 'SCHEDULED',
      };

      const updatedInterview = {
        id: 1,
        candidateId: 2,
        scheduledAt: '2026-09-05T11:00:00Z',
        status: 'COMPLETED',
      };

      (
        db.orm.public.Interview.first as jest.Mock
      ).mockResolvedValue(existingInterview);

      const updateMock = jest
        .fn()
        .mockResolvedValue(updatedInterview);

      (
        db.orm.public.Interview.where as jest.Mock
      ).mockReturnValue({
        update: updateMock,
      });

      const result = await service.update(1, {
        candidateId: 2,
        scheduledAt: '2026-09-05T11:00:00Z',
        status: 'COMPLETED',
      });

      expect(result).toEqual(updatedInterview);

      expect(
        db.orm.public.Interview.first,
      ).toHaveBeenCalledWith({
        id: 1,
      });

      expect(
        db.orm.public.Interview.where,
      ).toHaveBeenCalledWith({
        id: 1,
      });

      expect(updateMock).toHaveBeenCalledWith({
        candidateId: 2,
        scheduledAt: '2026-09-05T11:00:00Z',
        status: 'COMPLETED',
      });
    });

    it('should update only the provided interview fields', async () => {
      const existingInterview = {
        id: 1,
        candidateId: 1,
        scheduledAt: '2026-09-04T10:00:00Z',
        status: 'SCHEDULED',
      };

      const updatedInterview = {
        ...existingInterview,
        status: 'COMPLETED',
      };

      (
        db.orm.public.Interview.first as jest.Mock
      ).mockResolvedValue(existingInterview);

      const updateMock = jest
        .fn()
        .mockResolvedValue(updatedInterview);

      (
        db.orm.public.Interview.where as jest.Mock
      ).mockReturnValue({
        update: updateMock,
      });

      const result = await service.update(1, {
        status: 'COMPLETED',
      });

      expect(result).toEqual(updatedInterview);

      expect(updateMock).toHaveBeenCalledWith({
        status: 'COMPLETED',
      });
    });

    it('should update candidateId only', async () => {
      const existingInterview = {
        id: 1,
        candidateId: 1,
        scheduledAt: '2026-09-04T10:00:00Z',
        status: 'SCHEDULED',
      };

      (
        db.orm.public.Interview.first as jest.Mock
      ).mockResolvedValue(existingInterview);

      const updateMock = jest
        .fn()
        .mockResolvedValue({
          ...existingInterview,
          candidateId: 5,
        });

      (
        db.orm.public.Interview.where as jest.Mock
      ).mockReturnValue({
        update: updateMock,
      });

      await service.update(1, {
        candidateId: 5,
      });

      expect(updateMock).toHaveBeenCalledWith({
        candidateId: 5,
      });
    });

    it('should update scheduledAt only', async () => {
      const existingInterview = {
        id: 1,
        candidateId: 1,
        scheduledAt: '2026-09-04T10:00:00Z',
        status: 'SCHEDULED',
      };

      (
        db.orm.public.Interview.first as jest.Mock
      ).mockResolvedValue(existingInterview);

      const updateMock = jest
        .fn()
        .mockResolvedValue({
          ...existingInterview,
          scheduledAt: '2026-09-10T10:00:00Z',
        });

      (
        db.orm.public.Interview.where as jest.Mock
      ).mockReturnValue({
        update: updateMock,
      });

      await service.update(1, {
        scheduledAt: '2026-09-10T10:00:00Z',
      });

      expect(updateMock).toHaveBeenCalledWith({
        scheduledAt: '2026-09-10T10:00:00Z',
      });
    });

    it('should throw NotFoundException when updating a non-existent interview', async () => {
      (
        db.orm.public.Interview.first as jest.Mock
      ).mockResolvedValue(null);

      await expect(
        service.update(999, {
          status: 'COMPLETED',
        }),
      ).rejects.toThrow(
        new NotFoundException(
          'Interview with id 999 not found',
        ),
      );

      expect(
        db.orm.public.Interview.first,
      ).toHaveBeenCalledWith({
        id: 999,
      });

      expect(
        db.orm.public.Interview.where,
      ).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // DELETE
  // -------------------------------------------------------

  describe('delete', () => {
    it('should delete an existing interview', async () => {
      const existingInterview = {
        id: 1,
        candidateId: 1,
        scheduledAt: '2026-09-04T10:00:00Z',
        status: 'SCHEDULED',
      };

      (
        db.orm.public.Interview.first as jest.Mock
      ).mockResolvedValue(existingInterview);

      const deleteMock = jest
        .fn()
        .mockResolvedValue(undefined);

      (
        db.orm.public.Interview.where as jest.Mock
      ).mockReturnValue({
        delete: deleteMock,
      });

      const result = await service.delete(1);

      expect(result).toEqual({
        message:
          'Interview with id 1 deleted successfully',
      });

      expect(
        db.orm.public.Interview.first,
      ).toHaveBeenCalledWith({
        id: 1,
      });

      expect(
        db.orm.public.Interview.where,
      ).toHaveBeenCalledWith({
        id: 1,
      });

      expect(deleteMock).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when deleting a non-existent interview', async () => {
      (
        db.orm.public.Interview.first as jest.Mock
      ).mockResolvedValue(null);

      await expect(
        service.delete(999),
      ).rejects.toThrow(
        new NotFoundException(
          'Interview with id 999 not found',
        ),
      );

      expect(
        db.orm.public.Interview.first,
      ).toHaveBeenCalledWith({
        id: 999,
      });

      expect(
        db.orm.public.Interview.where,
      ).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // HEALTH
  // -------------------------------------------------------

  describe('health', () => {
    it('should return the interviews health status', () => {
      expect(service.getHealth()).toEqual({
        status: 'ok',
        module: 'interviews',
      });
    });
  });
});