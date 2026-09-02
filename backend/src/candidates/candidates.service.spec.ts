import { Test, TestingModule } from '@nestjs/testing';
import { CandidatesService } from './candidates.service';

describe('CandidatesService', () => {
  let service: CandidatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CandidatesService],
    }).compile();

    service = module.get<CandidatesService>(CandidatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return an empty candidate list initially', () => {
    expect(service.findAll()).toEqual([]);
  });

  it('should create a candidate', () => {
    const candidate = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      jobId: 1,
    };

    expect(service.create(candidate)).toEqual(candidate);
    expect(service.findAll()).toEqual([candidate]);
  });
});