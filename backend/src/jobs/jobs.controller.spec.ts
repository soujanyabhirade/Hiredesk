import { JobsController } from './jobs.controller.js';
import { JobsService } from './jobs.service.js';

jest.mock('./jobs.service.js', () => ({
  JobsService: jest.fn(),
}));

describe('JobsController', () => {
  let controller: JobsController;

  const jobsService = {
    getJobs: jest.fn(),
    health: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new JobsController(
      jobsService as unknown as JobsService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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

      jobsService.getJobs.mockResolvedValue(jobs);

      const result = await controller.getJobs();

      expect(result).toEqual(jobs);
      expect(jobsService.getJobs).toHaveBeenCalledTimes(1);
    });
  });

  describe('getHealth', () => {
    it('should return jobs health status', () => {
      const health = {
        status: 'ok',
        module: 'jobs',
      };

      jobsService.health.mockReturnValue(health);

      const result = controller.getHealth();

      expect(result).toEqual(health);
      expect(jobsService.health).toHaveBeenCalledTimes(1);
    });
  });

  describe('createJob', () => {
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

      jobsService.create.mockResolvedValue(createdJob);

      const result = await controller.createJob(input);

      expect(result).toEqual(createdJob);
      expect(jobsService.create).toHaveBeenCalledWith(input);
    });
  });
});