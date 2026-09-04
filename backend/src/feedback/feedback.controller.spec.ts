import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackController } from './feedback.controller.js';
import { FeedbackService } from './feedback.service.js';

jest.mock('../prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        Feedback: {
          create: jest.fn(),
          all: jest.fn(),
        },
      },
    },
  },
}));

describe('FeedbackController', () => {
  let controller: FeedbackController;

  const feedbackService = {
    create: jest.fn(),
    findAll: jest.fn(),
    getHealth: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    feedbackService.findAll.mockReturnValue([]);
    feedbackService.getHealth.mockReturnValue({
      status: 'ok',
      module: 'feedback',
    });

    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [FeedbackController],
        providers: [
          {
            provide: FeedbackService,
            useValue: feedbackService,
          },
        ],
      }).compile();

    controller =
      module.get<FeedbackController>(
        FeedbackController,
      );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return feedback', () => {
    expect(controller.findAll()).toEqual([]);

    expect(
      feedbackService.findAll,
    ).toHaveBeenCalledTimes(1);
  });

  it('should create feedback', () => {
    const feedback = {
      interviewId: 1,
      rating: 4,
      comments: 'Good interview',
    };

    feedbackService.create.mockReturnValue(feedback);

    expect(controller.create(feedback)).toEqual(
      feedback,
    );

    expect(
      feedbackService.create,
    ).toHaveBeenCalledWith(feedback);
  });

  it('should return health status', () => {
    expect(controller.getHealth()).toEqual({
      status: 'ok',
      module: 'feedback',
    });

    expect(
      feedbackService.getHealth,
    ).toHaveBeenCalledTimes(1);
  });
});