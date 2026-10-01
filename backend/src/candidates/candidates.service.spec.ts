import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { CandidatesService } from './candidates.service.js';
import { JobsService } from '../jobs/jobs.service.js';

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
          all: jest.fn(),
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

  let jobsService: JobsService;

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
        providers: [
          CandidatesService,
          JobsService,
        ],
      }).compile();

    service = module.get<CandidatesService>(
      CandidatesService,
    );

    jobsService = module.get<JobsService>(JobsService);
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

    it('should reject duplicate email for same jobId', async () => {
      (
        db.orm.public.Candidate.first as jest.Mock
      ).mockResolvedValue(mockCandidate);

      await expect(
        service.create({
          name: 'Test Candidate',
          email: 'test@example.com',
          phone: '9999999999',
          jobId: 1,
        }),
      ).rejects.toThrow(ConflictException);

      expect(
        db.orm.public.Candidate.first,
      ).toHaveBeenCalledWith({
        email: 'test@example.com',
        jobId: 1,
      });

      expect(
        db.orm.public.Candidate.create,
      ).not.toHaveBeenCalled();
    });

    it('should allow same email for different jobId', async () => {
      (
        db.orm.public.Candidate.first as jest.Mock
      ).mockResolvedValue(null);

      (
        db.orm.public.Candidate.create as jest.Mock
      ).mockResolvedValue({ ...mockCandidate, jobId: 2 });

      const result = await service.create({
        name: 'Test Candidate',
        email: 'test@example.com',
        phone: '9999999999',
        jobId: 2,
      });

      expect(
        db.orm.public.Candidate.first,
      ).toHaveBeenCalledWith({
        email: 'test@example.com',
        jobId: 2,
      });

      expect(
        db.orm.public.Candidate.create,
      ).toHaveBeenCalledWith({
        name: 'Test Candidate',
        email: 'test@example.com',
        phone: '9999999999',
        jobId: 2,
      });

      expect(result).toEqual({ ...mockCandidate, jobId: 2 });
    });

    it('should allow different email for same jobId', async () => {
      (
        db.orm.public.Candidate.first as jest.Mock
      ).mockResolvedValue(null);

      (
        db.orm.public.Candidate.create as jest.Mock
      ).mockResolvedValue({ ...mockCandidate, email: 'other@example.com' });

      const result = await service.create({
        name: 'Other Candidate',
        email: 'other@example.com',
        phone: '9999999999',
        jobId: 1,
      });

      expect(
        db.orm.public.Candidate.first,
      ).toHaveBeenCalledWith({
        email: 'other@example.com',
        jobId: 1,
      });

      expect(
        db.orm.public.Candidate.create,
      ).toHaveBeenCalled();

      expect(result.email).toBe('other@example.com');
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

  describe('exportCsv', () => {
    it('should export candidates with the job title', async () => {
      (
        db.orm.public.Candidate.all as jest.Mock
      ).mockResolvedValue([
        {
          ...mockCandidate,
          id: 2,
          name: 'Anna Candidate',
        },
        mockCandidate,
      ]);

      (
        db.orm.public.Job.all as jest.Mock
      ).mockResolvedValue([
        { id: 1, title: 'Backend Developer' },
      ]);

      const csv = await service.exportCsv();

      expect(csv).toBe(
        'name,email,phone,jobId,jobTitle\r\n' +
          'Anna Candidate,test@example.com,9999999999,1,Backend Developer\r\n' +
          'Test Candidate,test@example.com,9999999999,1,Backend Developer\r\n',
      );
    });

    it('should leave a null phone empty', async () => {
      (
        db.orm.public.Candidate.all as jest.Mock
      ).mockResolvedValue([
        { ...mockCandidate, phone: null },
      ]);

      (
        db.orm.public.Job.all as jest.Mock
      ).mockResolvedValue([
        { id: 1, title: 'Backend Developer' },
      ]);

      const csv = await service.exportCsv();

      expect(csv).toContain(
        'Test Candidate,test@example.com,,1,Backend Developer',
      );
    });

    it('should export only the filtered candidates', async () => {
      (
        db.orm.public.Candidate.all as jest.Mock
      ).mockResolvedValue([
        mockCandidate,
        {
          ...mockCandidate,
          id: 2,
          name: 'Other Person',
          email: 'other@example.com',
          jobId: 2,
        },
      ]);

      (
        db.orm.public.Job.all as jest.Mock
      ).mockResolvedValue([
        { id: 1, title: 'Backend Developer' },
        { id: 2, title: 'Frontend Developer' },
      ]);

      const csv = await service.exportCsv(1);

      expect(csv).toContain('Test Candidate');
      expect(csv).not.toContain('Other Person');
    });

    it('should export a newly created job so it can be imported again', async () => {
      // A job created during an import is now persisted, so the export has
      // to carry both the id and the title for the same job.
      (
        db.orm.public.Job.all as jest.Mock
      ).mockResolvedValue([
        { id: 9, title: 'Backend Engineer' },
      ]);

      (
        db.orm.public.Candidate.all as jest.Mock
      ).mockResolvedValue([
        {
          ...mockCandidate,
          name: 'Ada',
          email: 'ada@example.com',
          jobId: 9,
        },
      ]);

      const csv = await service.exportCsv();

      expect(csv).toContain(
        'name,email,phone,jobId,jobTitle',
      );

      expect(csv).toContain(
        'Ada,ada@example.com,9999999999,9,Backend Engineer',
      );
    });

    it('should export only candidates matching the search', async () => {
      (
        db.orm.public.Candidate.all as jest.Mock
      ).mockResolvedValue([
        mockCandidate,
        {
          ...mockCandidate,
          id: 2,
          name: 'Other Person',
          email: 'other@example.com',
        },
      ]);

      (
        db.orm.public.Job.all as jest.Mock
      ).mockResolvedValue([
        { id: 1, title: 'Backend Developer' },
      ]);

      const csv = await service.exportCsv(
        undefined,
        'other',
      );

      expect(csv).toContain('Other Person');
      expect(csv).not.toContain('Test Candidate');
    });
  });

  describe('importCsv', () => {
    beforeEach(() => {
      (
        db.orm.public.Job.all as jest.Mock
      ).mockResolvedValue([
        { id: 1, title: 'Backend Developer' },
      ]);
    });

    it('should import valid rows', async () => {
      (
        db.orm.public.Candidate.first as jest.Mock
      ).mockResolvedValue(null);

      (
        db.orm.public.Candidate.create as jest.Mock
      ).mockResolvedValue(mockCandidate);

      const result = await service.importCsv(
        [
          'name,email,phone,jobId,jobTitle',
          'Ada,ada@example.com,999,1,Backend Developer',
          'Grace,grace@example.com,,1,Backend Developer',
        ].join('\n'),
      );

      expect(result).toEqual({
        totalRows: 2,
        imported: 2,
        failed: 0,
        errors: [],
      });

      expect(
        db.orm.public.Candidate.create,
      ).toHaveBeenCalledWith({
        name: 'Ada',
        email: 'ada@example.com',
        phone: '999',
        jobId: 1,
      });
    });

    it('should resolve the job from its title', async () => {
      (
        db.orm.public.Candidate.first as jest.Mock
      ).mockResolvedValue(null);

      (
        db.orm.public.Candidate.create as jest.Mock
      ).mockResolvedValue(mockCandidate);

      const result = await service.importCsv(
        'name,email,jobTitle\nAda,ada@example.com,backend developer\n',
      );

      expect(result.imported).toBe(1);

      expect(
        db.orm.public.Candidate.create,
      ).toHaveBeenCalledWith({
        name: 'Ada',
        email: 'ada@example.com',
        phone: null,
        jobId: 1,
      });
    });

    it('should report an invalid email row', async () => {
      const result = await service.importCsv(
        'name,email,jobId\nAda,not-an-email,1\n',
      );

      expect(result).toEqual({
        totalRows: 1,
        imported: 0,
        failed: 1,
        errors: [
          {
            row: 2,
            message: 'email must be an email',
          },
        ],
      });

      expect(
        db.orm.public.Candidate.create,
      ).not.toHaveBeenCalled();
    });

    it('should report a missing name', async () => {
      const result = await service.importCsv(
        'name,email,jobId\n,ada@example.com,1\n',
      );

      expect(result.failed).toBe(1);
      expect(result.errors[0].row).toBe(2);
    });

    it('should create a job when the title does not exist yet', async () => {
      (
        db.orm.public.Job.all as jest.Mock
      ).mockResolvedValue([]);

      jest
        .spyOn(jobsService, 'create')
        .mockResolvedValue({
          id: 5,
          title: 'Unknown Job',
        } as never);

      (
        db.orm.public.Candidate.first as jest.Mock
      ).mockResolvedValue(null);

      (
        db.orm.public.Candidate.create as jest.Mock
      ).mockResolvedValue(mockCandidate);

      const result = await service.importCsv(
        'name,email,jobTitle\nAda,ada@example.com,Unknown Job\n',
      );

      expect(jobsService.create).toHaveBeenCalledTimes(1);

      // Only the title is sent, so the optional fields keep their
      // existing null defaults.
      expect(jobsService.create).toHaveBeenCalledWith(
        { title: 'Unknown Job' },
      );

      expect(
        db.orm.public.Candidate.create,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'ada@example.com',
          jobId: 5,
        }),
      );

      expect(result).toEqual({
        totalRows: 1,
        imported: 1,
        failed: 0,
        errors: [],
      });
    });

    it('should reuse an existing job when the title matches', async () => {
      (
        db.orm.public.Job.all as jest.Mock
      ).mockResolvedValue([
        { id: 2, title: 'Frontend Developer' },
      ]);

      const createSpy = jest.spyOn(jobsService, 'create');

      (
        db.orm.public.Candidate.first as jest.Mock
      ).mockResolvedValue(null);

      (
        db.orm.public.Candidate.create as jest.Mock
      ).mockResolvedValue(mockCandidate);

      const result = await service.importCsv(
        'name,email,jobTitle\nAda,ada@example.com,Frontend Developer\n',
      );

      expect(createSpy).not.toHaveBeenCalled();

      expect(
        db.orm.public.Candidate.create,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ jobId: 2 }),
      );

      expect(result.imported).toBe(1);
    });

    it('should create the job once for rows sharing a new title', async () => {
      (
        db.orm.public.Job.all as jest.Mock
      ).mockResolvedValue([]);

      const createSpy = jest
        .spyOn(jobsService, 'create')
        .mockResolvedValue({
          id: 7,
          title: 'Backend Engineer',
        } as never);

      (
        db.orm.public.Candidate.first as jest.Mock
      ).mockResolvedValue(null);

      (
        db.orm.public.Candidate.create as jest.Mock
      ).mockResolvedValue(mockCandidate);

      const result = await service.importCsv(
        [
          'name,email,jobTitle',
          'Row One,row1@example.com,Backend Engineer',
          'Row Two,row2@example.com,Backend Engineer',
          'Row Three,row3@example.com,Backend Engineer',
        ].join('\n'),
      );

      // Three rows, one Job.
      expect(createSpy).toHaveBeenCalledTimes(1);

      expect(
        db.orm.public.Candidate.create,
      ).toHaveBeenCalledTimes(3);

      for (const call of (
        db.orm.public.Candidate.create as jest.Mock
      ).mock.calls) {
        expect(call[0]).toEqual(
          expect.objectContaining({ jobId: 7 }),
        );
      }

      expect(result).toEqual({
        totalRows: 3,
        imported: 3,
        failed: 0,
        errors: [],
      });
    });

    it('should treat a created job as reusable for later rows that reference it by title in a different case', async () => {
      (
        db.orm.public.Job.all as jest.Mock
      ).mockResolvedValue([]);

      const createSpy = jest
        .spyOn(jobsService, 'create')
        .mockResolvedValue({
          id: 8,
          title: 'Data Engineer',
        } as never);

      (
        db.orm.public.Candidate.first as jest.Mock
      ).mockResolvedValue(null);

      (
        db.orm.public.Candidate.create as jest.Mock
      ).mockResolvedValue(mockCandidate);

      const result = await service.importCsv(
        [
          'name,email,jobTitle',
          'Row One,row1@example.com,Data Engineer',
          'Row Two,row2@example.com,data engineer',
        ].join('\n'),
      );

      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(result.imported).toBe(2);
    });

    it('should keep importing valid rows when one row has an unknown job id', async () => {
      (
        db.orm.public.Job.all as jest.Mock
      ).mockResolvedValue([
        { id: 1, title: 'Developer' },
      ]);

      (
        db.orm.public.Candidate.first as jest.Mock
      ).mockResolvedValue(null);

      (
        db.orm.public.Candidate.create as jest.Mock
      ).mockResolvedValue(mockCandidate);

      const result = await service.importCsv(
        [
          'name,email,jobId,jobTitle',
          'Good,good@example.com,1,Developer',
          'Bad,bad@example.com,99,Backend Engineer',
        ].join('\n'),
      );

      expect(result).toEqual({
        totalRows: 2,
        imported: 1,
        failed: 1,
        errors: [
          {
            row: 3,
            message: 'Job with id 99 not found',
          },
        ],
      });
    });

    it('should not create a job from the title when the given job id does not exist', async () => {
      (
        db.orm.public.Job.all as jest.Mock
      ).mockResolvedValue([]);

      const createSpy = jest.spyOn(jobsService, 'create');

      const result = await service.importCsv(
        'name,email,jobId,jobTitle\nAda,ada@example.com,99,Backend Engineer\n',
      );

      expect(createSpy).not.toHaveBeenCalled();

      expect(
        db.orm.public.Candidate.create,
      ).not.toHaveBeenCalled();

      expect(result.errors[0]).toEqual({
        row: 2,
        message: 'Job with id 99 not found',
      });
    });

    it('should report an unknown job id', async () => {
      const result = await service.importCsv(
        'name,email,jobId\nAda,ada@example.com,99\n',
      );

      expect(result.errors[0]).toEqual({
        row: 2,
        message: 'Job with id 99 not found',
      });
    });

    it('should report a job id that does not match the job title', async () => {
      const result = await service.importCsv(
        'name,email,jobId,jobTitle\nAda,ada@example.com,1,Designer\n',
      );

      expect(result.errors[0]).toEqual({
        row: 2,
        message:
          'jobId 1 does not match jobTitle "Designer"',
      });
    });

    it('should report an ambiguous job title', async () => {
      (
        db.orm.public.Job.all as jest.Mock
      ).mockResolvedValue([
        { id: 1, title: 'Developer' },
        { id: 2, title: 'developer' },
      ]);

      const result = await service.importCsv(
        'name,email,jobTitle\nAda,ada@example.com,Developer\n',
      );

      expect(result.errors[0]).toEqual({
        row: 2,
        message:
          'Multiple jobs are titled "Developer". Use jobId instead.',
      });
    });

    it('should report a duplicate row and still import the others', async () => {
      (
        db.orm.public.Candidate.first as jest.Mock
      )
        .mockResolvedValueOnce(mockCandidate)
        .mockResolvedValueOnce(null);

      (
        db.orm.public.Candidate.create as jest.Mock
      ).mockResolvedValue(mockCandidate);

      const result = await service.importCsv(
        [
          'name,email,jobId',
          'Ada,ada@example.com,1',
          'Grace,grace@example.com,1',
        ].join('\n'),
      );

      expect(result.imported).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors[0]).toEqual({
        row: 2,
        message:
          'Candidate with email ada@example.com already exists for this job',
      });
    });

    it('should reject a file without the required columns', async () => {
      await expect(
        service.importCsv('name,jobId\nAda,1\n'),
      ).rejects.toThrow(
        'Missing required column(s): email.',
      );
    });
  });
});