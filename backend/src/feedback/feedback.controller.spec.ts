import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackController } from './feedback.controller.js';
import { FeedbackService } from './feedback.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

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
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({
          canActivate: jest.fn().mockReturnValue(true),
        })
        .overrideGuard(RolesGuard)
        .useValue({
          canActivate: jest.fn().mockReturnValue(true),
        })
        .compile();

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
      rating: 5,
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