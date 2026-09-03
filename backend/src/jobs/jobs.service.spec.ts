import { JobsService } from './jobs.service.js';

jest.mock('../prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        Job: {
          all: jest.fn(),
          create: jest.fn(),
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

  describe('getJobs', () => {
    it('should return jobs', async () => {
      const jobs = [
        {
          id: 1,
          title: 'Backend Developer',
          description: 'NestJS developer',
          location: 'Remote',
          status: 'OPEN',
        },
      ];

      (
        db.orm.public.Job.all as jest.Mock
      ).mockResolvedValue(jobs);

      const result = await service.getJobs();

      expect(result).toEqual(jobs);
      expect(db.orm.public.Job.all).toHaveBeenCalledTimes(1);
    });

    it('should return an empty jobs array initially', async () => {
      (
        db.orm.public.Job.all as jest.Mock
      ).mockResolvedValue([]);

      const result = await service.getJobs();

      expect(result).toEqual([]);
    });
  });

  describe('health', () => {
    it('should return jobs health status', () => {
      expect(service.health()).toEqual({
        status: 'ok',
        module: 'jobs',
      });
    });
  });

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

      expect(db.orm.public.Job.create).toHaveBeenCalledWith({
        title: 'Backend Developer',
        description: 'NestJS developer',
        location: 'Remote',
      });
    });
  });
});