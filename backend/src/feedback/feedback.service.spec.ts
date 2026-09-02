import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackService } from './feedback.service';

describe('FeedbackService', () => {
  let service: FeedbackService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeedbackService],
    }).compile();

    service = module.get<FeedbackService>(FeedbackService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return an empty feedback list initially', () => {
    expect(service.findAll()).toEqual([]);
  });

  it('should create feedback', () => {
    const feedback = {
      interviewId: 1,
      rating: 4,
      comments: 'Good interview',
    };

    expect(service.create(feedback)).toEqual(feedback);
    expect(service.findAll()).toEqual([feedback]);
  });
});