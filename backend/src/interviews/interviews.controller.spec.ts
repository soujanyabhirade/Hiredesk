import { Test, TestingModule } from '@nestjs/testing';
import { InterviewsController } from './interviews.controller.js';
import { InterviewsService } from './interviews.service.js';

describe('InterviewsController', () => {
  let controller: InterviewsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InterviewsController],
      providers: [InterviewsService],
    }).compile();

    controller = module.get<InterviewsController>(InterviewsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});