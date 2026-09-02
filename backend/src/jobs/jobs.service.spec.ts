import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';

describe('JobsService', () => {
  let service: JobsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobsService],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return an empty jobs array', () => {
    expect(service.getJobs()).toEqual([]);
  });

  it('should return jobs health status', () => {
    expect(service.getHealth()).toEqual({
      status: 'ok',
      module: 'jobs',
    });
  });
});