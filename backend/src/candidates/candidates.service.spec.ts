import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

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
  };

  beforeEach(async () => {
    jest.clearAllMocks();

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
    it('should return all candidates', async () => {
      (
        db.orm.public.Candidate.all as jest.Mock
      ).mockResolvedValue([mockCandidate]);

      const result = await service.findAll();

      expect(
        db.orm.public.Candidate.all,
      ).toHaveBeenCalled();

      expect(result).toEqual([mockCandidate]);
    });
  });

  describe('findOne', () => {
    it('should return one candidate', async () => {
      (
        db.orm.public.Candidate.first as jest.Mock
      ).mockResolvedValue(mockCandidate);

      const result = await service.findOne(17);

      expect(
        db.orm.public.Candidate.first,
      ).toHaveBeenCalledWith({
        id: 17,
      });

      expect(result).toEqual(mockCandidate);
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
    it('should delete a candidate', async () => {
      (
        db.orm.public.Candidate.first as jest.Mock
      ).mockResolvedValue(mockCandidate);

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