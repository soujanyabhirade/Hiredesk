import { Test, TestingModule } from '@nestjs/testing';
import { InterviewsController } from './interviews.controller.js';
import { InterviewsService } from './interviews.service.js';

jest.mock('../prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        Interview: {
          create: jest.fn(),
          all: jest.fn(),
        },
      },
    },
  },
}));

describe('InterviewsController', () => {
  let controller: InterviewsController;

  const interviewsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    getHealth: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    interviewsService.findAll.mockReturnValue([]);
    interviewsService.getHealth.mockReturnValue({
      status: 'ok',
      module: 'interviews',
    });

    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [InterviewsController],
        providers: [
          {
            provide: InterviewsService,
            useValue: interviewsService,
          },
        ],
      }).compile();

    controller =
      module.get<InterviewsController>(
        InterviewsController,
      );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return interviews', () => {
    expect(controller.findAll()).toEqual([]);

    expect(
      interviewsService.findAll,
    ).toHaveBeenCalledTimes(1);
  });

  it('should create an interview', () => {
    const interview = {
      candidateId: 1,
      scheduledAt: '2026-09-04T10:00:00Z',
      status: 'SCHEDULED',
    };

    interviewsService.create.mockReturnValue(interview);

    expect(controller.create(interview)).toEqual(
      interview,
    );

    expect(
      interviewsService.create,
    ).toHaveBeenCalledWith(interview);
  });

  it('should return health status', () => {
    expect(controller.getHealth()).toEqual({
      status: 'ok',
      module: 'interviews',
    });

    expect(
      interviewsService.getHealth,
    ).toHaveBeenCalledTimes(1);
  });
});