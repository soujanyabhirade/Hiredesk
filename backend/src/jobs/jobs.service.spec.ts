import { ConflictException, NotFoundException } from '@nestjs/common';
import { JobsService } from './jobs.service.js';

jest.mock('../prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        Job: {
          all: jest.fn(),
          create: jest.fn(),
          first: jest.fn(),
          where: jest.fn(),
        },
        Candidate: {
          all: jest.fn(),
        },
      },
    },
  },
}));

import { db } from '../prisma/db.js';

describe('JobsService', () => {
  let service: JobsService;

  beforeEach(() => {
    service = new JobsService();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // -------------------------------------------------------
  // GET JOBS
  // -------------------------------------------------------

  describe('getJobs', () => {
    it('should return paginated jobs', async () => {
      const jobs = [
        {
          id: 1,
          title: 'Backend Developer',
          description: 'NestJS developer',
          location: 'Remote',
          status: 'OPEN',
          createdAt: '2026-09-04T10:00:00Z',
        },
      ];

      (db.orm.public.Job.all as jest.Mock).mockResolvedValue(jobs);

      const result = await service.getJobs();

      expect(result).toEqual({
        data: jobs,
        page: 1,
        limit: 5,
        search: '',
        status: null,
        sort: 'newest',
        total: 1,
      });

      expect(db.orm.public.Job.all).toHaveBeenCalledTimes(1);
    });

    it('should return an empty paginated jobs response initially', async () => {
      (db.orm.public.Job.all as jest.Mock).mockResolvedValue([]);

      const result = await service.getJobs();

      expect(result).toEqual({
        data: [],
        page: 1,
        limit: 5,
        search: '',
        status: null,
        sort: 'newest',
        total: 0,
      });
    });

    it('should filter jobs by search term', async () => {
      const jobs = [
        {
          id: 1,
          title: 'Backend Developer',
          description: 'NestJS developer',
          location: 'Bangalore',
          status: 'OPEN',
          createdAt: '2026-09-04T10:00:00Z',
        },
        {
          id: 2,
          title: 'Frontend Developer',
          description: 'React developer',
          location: 'Remote',
          status: 'OPEN',
          createdAt: '2026-09-03T10:00:00Z',
        },
        {
          id: 3,
          title: 'Data Scientist',
          description: 'Machine learning role',
          location: 'Bangalore',
          status: 'CLOSED',
          createdAt: '2026-09-02T10:00:00Z',
        },
      ];

      (db.orm.public.Job.all as jest.Mock).mockResolvedValue(jobs);

      const result = await service.getJobs(
        1,
        5,
        '  BACKEND  ',
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Backend Developer');
      expect(result.search).toBe('backend');
      expect(result.total).toBe(1);
    });

    it('should filter jobs by description and location', async () => {
      const jobs = [
        {
          id: 1,
          title: 'Software Engineer',
          description: 'NestJS backend development',
          location: 'Bangalore',
          status: 'OPEN',
          createdAt: '2026-09-04T10:00:00Z',
        },
        {
          id: 2,
          title: 'Software Engineer',
          description: 'React development',
          location: 'Remote',
          status: 'OPEN',
          createdAt: '2026-09-03T10:00:00Z',
        },
      ];

      (db.orm.public.Job.all as jest.Mock).mockResolvedValue(jobs);

      const descriptionResult = await service.getJobs(
        1,
        5,
        'nestjs',
      );

      expect(descriptionResult.data).toHaveLength(1);
      expect(descriptionResult.data[0].id).toBe(1);

      const locationResult = await service.getJobs(
        1,
        5,
        'remote',
      );

      expect(locationResult.data).toHaveLength(1);
      expect(locationResult.data[0].id).toBe(2);
    });

    it('should filter jobs by status', async () => {
      const jobs = [
        {
          id: 1,
          title: 'Backend Developer',
          description: 'NestJS developer',
          location: 'Remote',
          status: 'OPEN',
          createdAt: '2026-09-04T10:00:00Z',
        },
        {
          id: 2,
          title: 'Frontend Developer',
          description: 'React developer',
          location: 'Bangalore',
          status: 'CLOSED',
          createdAt: '2026-09-03T10:00:00Z',
        },
      ];

      (db.orm.public.Job.all as jest.Mock).mockResolvedValue(jobs);

      const result = await service.getJobs(
        1,
        5,
        '',
        '  OPEN  ',
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1);
      expect(result.status).toBe('open');
      expect(result.total).toBe(1);
    });

    it('should filter by search and status together', async () => {
      const jobs = [
        {
          id: 1,
          title: 'Backend Developer',
          description: 'NestJS developer',
          location: 'Remote',
          status: 'OPEN',
          createdAt: '2026-09-04T10:00:00Z',
        },
        {
          id: 2,
          title: 'Backend Developer',
          description: 'NestJS developer',
          location: 'Remote',
          status: 'CLOSED',
          createdAt: '2026-09-03T10:00:00Z',
        },
      ];

      (db.orm.public.Job.all as jest.Mock).mockResolvedValue(jobs);

      const result = await service.getJobs(
        1,
        5,
        'backend',
        'open',
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1);
      expect(result.total).toBe(1);
    });

    it('should sort jobs by oldest', async () => {
      const jobs = [
        {
          id: 1,
          title: 'New Job',
          description: 'New',
          location: 'Remote',
          status: 'OPEN',
          createdAt: '2026-09-05T10:00:00Z',
        },
        {
          id: 2,
          title: 'Old Job',
          description: 'Old',
          location: 'Remote',
          status: 'OPEN',
          createdAt: '2026-09-01T10:00:00Z',
        },
      ];

      (db.orm.public.Job.all as jest.Mock).mockResolvedValue(jobs);

      const result = await service.getJobs(
        1,
        5,
        '',
        undefined,
        'oldest',
      );

      expect(result.data.map((job) => job.id)).toEqual([
        2,
        1,
      ]);
      expect(result.sort).toBe('oldest');
    });

    it('should sort jobs by title ascending', async () => {
      const jobs = [
        {
          id: 1,
          title: 'Zebra Developer',
          description: 'Z',
          location: 'Remote',
          status: 'OPEN',
          createdAt: '2026-09-01T10:00:00Z',
        },
        {
          id: 2,
          title: 'Backend Developer',
          description: 'B',
          location: 'Remote',
          status: 'OPEN',
          createdAt: '2026-09-02T10:00:00Z',
        },
      ];

      (db.orm.public.Job.all as jest.Mock).mockResolvedValue(jobs);

      const result = await service.getJobs(
        1,
        5,
        '',
        undefined,
        'titleAsc',
      );

      expect(result.data.map((job) => job.title)).toEqual([
        'Backend Developer',
        'Zebra Developer',
      ]);
    });

    it('should sort jobs by title descending', async () => {
      const jobs = [
        {
          id: 1,
          title: 'Backend Developer',
          description: 'B',
          location: 'Remote',
          status: 'OPEN',
          createdAt: '2026-09-01T10:00:00Z',
        },
        {
          id: 2,
          title: 'Zebra Developer',
          description: 'Z',
          location: 'Remote',
          status: 'OPEN',
          createdAt: '2026-09-02T10:00:00Z',
        },
      ];

      (db.orm.public.Job.all as jest.Mock).mockResolvedValue(jobs);

      const result = await service.getJobs(
        1,
        5,
        '',
        undefined,
        'titleDesc',
      );

      expect(result.data.map((job) => job.title)).toEqual([
        'Zebra Developer',
        'Backend Developer',
      ]);
    });

    it('should use newest sorting by default', async () => {
      const jobs = [
        {
          id: 1,
          title: 'Old Job',
          description: 'Old',
          location: 'Remote',
          status: 'OPEN',
          createdAt: '2026-09-01T10:00:00Z',
        },
        {
          id: 2,
          title: 'New Job',
          description: 'New',
          location: 'Remote',
          status: 'OPEN',
          createdAt: '2026-09-05T10:00:00Z',
        },
      ];

      (db.orm.public.Job.all as jest.Mock).mockResolvedValue(jobs);

      const result = await service.getJobs();

      expect(result.data.map((job) => job.id)).toEqual([
        2,
        1,
      ]);
      expect(result.sort).toBe('newest');
    });

    it('should fall back to newest sorting for an unknown sort value', async () => {
      const jobs = [
        {
          id: 1,
          title: 'Old Job',
          description: 'Old',
          location: 'Remote',
          status: 'OPEN',
          createdAt: '2026-09-01T10:00:00Z',
        },
        {
          id: 2,
          title: 'New Job',
          description: 'New',
          location: 'Remote',
          status: 'OPEN',
          createdAt: '2026-09-05T10:00:00Z',
        },
      ];

      (db.orm.public.Job.all as jest.Mock).mockResolvedValue(jobs);

      const result = await service.getJobs(
        1,
        5,
        '',
        undefined,
        'invalidSort',
      );

      expect(result.data.map((job) => job.id)).toEqual([
        2,
        1,
      ]);
      expect(result.sort).toBe('invalidSort');
    });

    it('should paginate jobs correctly', async () => {
      const jobs = Array.from({ length: 7 }, (_, index) => ({
        id: index + 1,
        title: `Job ${index + 1}`,
        description: `Description ${index + 1}`,
        location: 'Remote',
        status: 'OPEN',
        createdAt: `2026-09-${String(10 - index).padStart(2, '0')}T10:00:00Z`,
      }));

      (db.orm.public.Job.all as jest.Mock).mockResolvedValue(jobs);

      const result = await service.getJobs(2, 3);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(3);
      expect(result.total).toBe(7);
      expect(result.data).toHaveLength(3);
    });

    it('should clamp invalid page and limit values', async () => {
      const jobs = [
        {
          id: 1,
          title: 'Backend Developer',
          description: 'NestJS',
          location: 'Remote',
          status: 'OPEN',
          createdAt: '2026-09-04T10:00:00Z',
        },
      ];

      (db.orm.public.Job.all as jest.Mock).mockResolvedValue(jobs);

      const result = await service.getJobs(0, 100);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
    });
  });

  // -------------------------------------------------------
  // GET JOB BY ID
  // -------------------------------------------------------

  describe('getJobById', () => {
    it('should return a job by id', async () => {
      const job = {
        id: 1,
        title: 'Backend Developer',
        description: 'NestJS developer',
        location: 'Remote',
        status: 'OPEN',
      };

      (db.orm.public.Job.first as jest.Mock).mockResolvedValue(job);

      const result = await service.getJobById(1);

      expect(result).toEqual(job);

      expect(
        db.orm.public.Job.first,
      ).toHaveBeenCalledWith({
        id: 1,
      });
    });

    it('should throw NotFoundException when job does not exist', async () => {
      (db.orm.public.Job.first as jest.Mock).mockResolvedValue(null);

      await expect(
        service.getJobById(999),
      ).rejects.toThrow(
        new NotFoundException(
          'Job with id 999 not found',
        ),
      );

      expect(
        db.orm.public.Job.first,
      ).toHaveBeenCalledWith({
        id: 999,
      });
    });
  });

  // -------------------------------------------------------
  // UPDATE JOB
  // -------------------------------------------------------

  describe('updateJob', () => {
    it('should update an existing job', async () => {
      const existingJob = {
        id: 1,
        title: 'Backend Developer',
        description: 'NestJS developer',
        location: 'Remote',
        status: 'OPEN',
      };

      const updatedJob = {
        ...existingJob,
        title: 'Senior Backend Developer',
        location: 'Bangalore',
        status: 'CLOSED',
      };

      (db.orm.public.Job.first as jest.Mock).mockResolvedValue(
        existingJob,
      );

      const updateMock = jest
        .fn()
        .mockResolvedValue(updatedJob);

      (db.orm.public.Job.where as jest.Mock).mockReturnValue({
        update: updateMock,
      });

      const result = await service.updateJob(1, {
        title: 'Senior Backend Developer',
        location: 'Bangalore',
        status: 'CLOSED',
      });

      expect(result).toEqual(updatedJob);

      expect(
        db.orm.public.Job.first,
      ).toHaveBeenCalledWith({
        id: 1,
      });

      expect(
        db.orm.public.Job.where,
      ).toHaveBeenCalledWith({
        id: 1,
      });

      expect(updateMock).toHaveBeenCalledWith({
        title: 'Senior Backend Developer',
        location: 'Bangalore',
        status: 'CLOSED',
      });
    });

    it('should update only the fields provided', async () => {
      const existingJob = {
        id: 1,
        title: 'Backend Developer',
        description: 'NestJS developer',
        location: 'Remote',
        status: 'OPEN',
      };

      (db.orm.public.Job.first as jest.Mock).mockResolvedValue(
        existingJob,
      );

      const updateMock = jest
        .fn()
        .mockResolvedValue({
          ...existingJob,
          title: 'Senior Backend Developer',
        });

      (db.orm.public.Job.where as jest.Mock).mockReturnValue({
        update: updateMock,
      });

      await service.updateJob(1, {
        title: 'Senior Backend Developer',
      });

      expect(updateMock).toHaveBeenCalledWith({
        title: 'Senior Backend Developer',
      });
    });

    it('should throw NotFoundException when updating non-existent job', async () => {
      (db.orm.public.Job.first as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateJob(999, {
          title: 'Updated Job',
        }),
      ).rejects.toThrow(
        new NotFoundException(
          'Job with id 999 not found',
        ),
      );

      expect(
        db.orm.public.Job.where,
      ).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // DELETE JOB
  // -------------------------------------------------------

  describe('deleteJob', () => {
    it('should delete a job when no candidates are linked', async () => {
      const job = {
        id: 1,
        title: 'Backend Developer',
        description: 'NestJS developer',
        location: 'Remote',
        status: 'OPEN',
      };

      (db.orm.public.Job.first as jest.Mock).mockResolvedValue(
        job,
      );

      (db.orm.public.Candidate.all as jest.Mock).mockResolvedValue(
        [],
      );

      const deleteMock = jest.fn().mockResolvedValue(undefined);

      (db.orm.public.Job.where as jest.Mock).mockReturnValue({
        delete: deleteMock,
      });

      const result = await service.deleteJob(1);

      expect(result).toEqual({
        message: 'Job with id 1 deleted successfully',
      });

      expect(
        db.orm.public.Job.first,
      ).toHaveBeenCalledWith({
        id: 1,
      });

      expect(
        db.orm.public.Candidate.all,
      ).toHaveBeenCalledTimes(1);

      expect(
        db.orm.public.Job.where,
      ).toHaveBeenCalledWith({
        id: 1,
      });

      expect(deleteMock).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when deleting non-existent job', async () => {
      (db.orm.public.Job.first as jest.Mock).mockResolvedValue(null);

      await expect(
        service.deleteJob(999),
      ).rejects.toThrow(
        new NotFoundException(
          'Job with id 999 not found',
        ),
      );

      expect(
        db.orm.public.Candidate.all,
      ).not.toHaveBeenCalled();

      expect(
        db.orm.public.Job.where,
      ).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when candidates are linked to the job', async () => {
      const job = {
        id: 1,
        title: 'Backend Developer',
        description: 'NestJS developer',
        location: 'Remote',
        status: 'OPEN',
      };

      (db.orm.public.Job.first as jest.Mock).mockResolvedValue(
        job,
      );

      (db.orm.public.Candidate.all as jest.Mock).mockResolvedValue([
        {
          id: 10,
          name: 'Candidate One',
          email: 'candidate@example.com',
          jobId: 1,
        },
      ]);

      await expect(
        service.deleteJob(1),
      ).rejects.toThrow(
        new ConflictException(
          'Job with id 1 cannot be deleted because candidates are linked to it',
        ),
      );

      expect(
        db.orm.public.Job.where,
      ).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // HEALTH
  // -------------------------------------------------------

  describe('health', () => {
    it('should return jobs health status', () => {
      expect(service.health()).toEqual({
        status: 'ok',
        module: 'jobs',
      });
    });
  });

  // -------------------------------------------------------
  // CREATE
  // -------------------------------------------------------

  describe('create', () => {
    it('should create a job', async () => {
      const input = {
        title: 'Backend Developer',
        description: 'NestJS developer',
        location: 'Remote',
      };

      const createdJob = {
        id: 1,
        ...input,
        status: 'OPEN',
      };

      (
        db.orm.public.Job.create as jest.Mock
      ).mockResolvedValue(createdJob);

      const result = await service.create(input);

      expect(result).toEqual(createdJob);

      expect(
        db.orm.public.Job.create,
      ).toHaveBeenCalledWith({
        title: 'Backend Developer',
        description: 'NestJS developer',
        location: 'Remote',
      });
    });

    it('should create a job with null optional fields', async () => {
      const input = {
        title: 'Backend Developer',
      };

      const createdJob = {
        id: 2,
        title: 'Backend Developer',
        description: null,
        location: null,
        status: 'OPEN',
      };

      (
        db.orm.public.Job.create as jest.Mock
      ).mockResolvedValue(createdJob);

      const result = await service.create(input);

      expect(result).toEqual(createdJob);

      expect(
        db.orm.public.Job.create,
      ).toHaveBeenCalledWith({
        title: 'Backend Developer',
        description: null,
        location: null,
      });
    });
  });
});