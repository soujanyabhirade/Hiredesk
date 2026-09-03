import { Test, TestingModule } from '@nestjs/testing';
import { InterviewsService } from './interviews.service.js';

describe('InterviewsService', () => {
  let service: InterviewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InterviewsService],
    }).compile();

    service = module.get<InterviewsService>(InterviewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return an empty interview list initially', () => {
    expect(service.findAll()).toEqual([]);
  });

  it('should create an interview', () => {
    const interview = {
      candidateId: 1,
      scheduledAt: '2026-09-04T10:00:00Z',
      status: 'SCHEDULED',
    };

    expect(service.create(interview)).toEqual(interview);
    expect(service.findAll()).toEqual([interview]);
  });
});