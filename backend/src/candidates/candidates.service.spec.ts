import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { CandidatesService } from './candidates.service.js';

jest.mock('../prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        Candidate: {
          create: jest.fn(),
          all: jest.fn(),
          first: jest.fn(),
          where: jest.fn(),
        },
        Job: {
          first: jest.fn(),
        },
        Interview: {
          all: jest.fn(),
        },
      },
    },
  },
}));

import { db } from '../prisma/db.js';

describe('CandidatesService', () => {
  let service: CandidatesService;

  const mockCandidate = {
    id: 17,
    name: 'Test Candidate',
    email: 'test@example.com',
    phone: '9999999999',
    jobId: 1,
    createdAt: '2026-09-04T10:00:00Z',
    updatedAt: '2026-09-04T10:00:00Z',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    (
      db.orm.public.Job.first as jest.Mock
    ).mockResolvedValue({ id: 1 });

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [CandidatesService],
      }).compile();

    service = module.get<CandidatesService>(
      CandidatesService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a candidate', async () => {
      (
        db.orm.public.Candidate.create as jest.Mock
      ).mockResolvedValue(mockCandidate);

      const result = await service.create({
        name: 'Test Candidate',
        email: 'test@example.com',
        phone: '9999999999',
        jobId: 1,
      });

      expect(
        db.orm.public.Candidate.create,
      ).toHaveBeenCalledWith({
        name: 'Test Candidate',
        email: 'test@example.com',
        phone: '9999999999',
        jobId: 1,
      });

      expect(result).toEqual(mockCandidate);
    });
  });

  describe('findAll', () => {
    it('should return paginated candidates', async () => {
      (
        db.orm.public.Candidate.all as jest.Mock
      ).mockResolvedValue([mockCandidate]);

      const result = await service.findAll();

      expect(
        db.orm.public.Candidate.all,
      ).toHaveBeenCalled();

      expect(result).toEqual({
        data: [mockCandidate],
        page: 1,
        limit: 5,
        search: '',
        jobId: null,
        sort: 'newest',
        total: 1,
      });
    });
  });

  describe('findOne', () => {
    it('should return one candidate with job details', async () => {
      (
        db.orm.public.Candidate.first as jest.Mock
      ).mockResolvedValue(mockCandidate);

      (
        db.orm.public.Job.first as jest.Mock
      ).mockResolvedValue({
        id: 1,
        title: 'Backend Developer',
        location: 'Remote',
        status: 'OPEN',
      });

      const result = await service.findOne(17);

      expect(
        db.orm.public.Candidate.first,
      ).toHaveBeenCalledWith({
        id: 17,
      });

      expect(
        db.orm.public.Job.first,
      ).toHaveBeenCalledWith({
        id: 1,
      });

      expect(result).toEqual({
        ...mockCandidate,
        job: {
          id: 1,
          title: 'Backend Developer',
          location: 'Remote',
          status: 'OPEN',
        },
      });
    });

    it('should throw NotFoundException when candidate does not exist', async () => {
      (
        db.orm.public.Candidate.first as jest.Mock
      ).mockResolvedValue(null);

      await expect(
        service.findOne(99999),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a candidate', async () => {
      (
        db.orm.public.Candidate.first as jest.Mock
      ).mockResolvedValue(mockCandidate);

      const updateMock = jest.fn().mockResolvedValue({
        ...mockCandidate,
        name: 'Updated Candidate',
      });

      (
        db.orm.public.Candidate.where as jest.Mock
      ).mockReturnValue({
        update: updateMock,
      });

      const result = await service.update(17, {
        name: 'Updated Candidate',
      });

      expect(
        db.orm.public.Candidate.first,
      ).toHaveBeenCalledWith({
        id: 17,
      });

      expect(
        db.orm.public.Candidate.where,
      ).toHaveBeenCalledWith({
        id: 17,
      });

      expect(updateMock).toHaveBeenCalledWith({
        name: 'Updated Candidate',
      });

      expect(result).toEqual({
        ...mockCandidate,
        name: 'Updated Candidate',
      });
    });

    it('should throw NotFoundException when updating a missing candidate', async () => {
      (
        db.orm.public.Candidate.first as jest.Mock
      ).mockResolvedValue(null);

      await expect(
        service.update(99999, {
          name: 'Updated Candidate',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a candidate without interviews', async () => {
      (
        db.orm.public.Candidate.first as jest.Mock
      ).mockResolvedValue(mockCandidate);

      (
        db.orm.public.Interview.all as jest.Mock
      ).mockResolvedValue([]);

      const deleteMock = jest.fn().mockResolvedValue(undefined);

      (
        db.orm.public.Candidate.where as jest.Mock
      ).mockReturnValue({
        delete: deleteMock,
      });

      const result = await service.delete(17);

      expect(
        db.orm.public.Candidate.first,
      ).toHaveBeenCalledWith({
        id: 17,
      });

      expect(
        db.orm.public.Interview.all,
      ).toHaveBeenCalled();

      expect(
        db.orm.public.Candidate.where,
      ).toHaveBeenCalledWith({
        id: 17,
      });

      expect(deleteMock).toHaveBeenCalled();

      expect(result).toEqual({
        message:
          'Candidate with id 17 deleted successfully',
      });
    });

    it('should prevent deleting a candidate with interviews', async () => {
      (
        db.orm.public.Candidate.first as jest.Mock
      ).mockResolvedValue(mockCandidate);

      (
        db.orm.public.Interview.all as jest.Mock
      ).mockResolvedValue([
        {
          id: 1,
          candidateId: 17,
          scheduledAt: '2026-09-10T10:00:00Z',
          status: 'SCHEDULED',
        },
      ]);

      await expect(
        service.delete(17),
      ).rejects.toThrow(ConflictException);

      expect(
        db.orm.public.Candidate.where,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when deleting a missing candidate', async () => {
      (
        db.orm.public.Candidate.first as jest.Mock
      ).mockResolvedValue(null);

      await expect(
        service.delete(99999),
      ).rejects.toThrow(NotFoundException);
    });
  });
});