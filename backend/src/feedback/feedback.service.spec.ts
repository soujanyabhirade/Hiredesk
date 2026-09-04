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

import { db } from '../prisma/db.js';

describe('FeedbackService', () => {
  let service: FeedbackService;

  beforeEach(() => {
    service = new FeedbackService();

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create feedback using Prisma', async () => {
    const feedback = {
      id: 1,
      interviewId: 1,
      rating: 4,
      comments: 'Good interview',
      createdAt: '2026-09-04T10:00:00Z',
      updatedAt: '2026-09-04T10:00:00Z',
    };

    (
      db.orm.public.Feedback.create as jest.Mock
    ).mockResolvedValue(feedback);

    const result = await service.create({
      interviewId: 1,
      rating: 4,
      comments: 'Good interview',
    });

    expect(result).toEqual(feedback);

    expect(
      db.orm.public.Feedback.create,
    ).toHaveBeenCalledWith({
      interviewId: 1,
      rating: 4,
      comments: 'Good interview',
    });
  });

  it('should create feedback without comments', async () => {
    const feedback = {
      id: 2,
      interviewId: 1,
      rating: 5,
      comments: null,
    };

    (
      db.orm.public.Feedback.create as jest.Mock
    ).mockResolvedValue(feedback);

    const result = await service.create({
      interviewId: 1,
      rating: 5,
    });

    expect(result).toEqual(feedback);

    expect(
      db.orm.public.Feedback.create,
    ).toHaveBeenCalledWith({
      interviewId: 1,
      rating: 5,
    });
  });

  it('should return all feedback using Prisma', async () => {
    const feedback = [
      {
        id: 1,
        interviewId: 1,
        rating: 4,
        comments: 'Good interview',
      },
      {
        id: 2,
        interviewId: 2,
        rating: 5,
        comments: 'Excellent interview',
      },
    ];

    (
      db.orm.public.Feedback.all as jest.Mock
    ).mockResolvedValue(feedback);

    const result = await service.findAll();

    expect(result).toEqual(feedback);

    expect(
      db.orm.public.Feedback.all,
    ).toHaveBeenCalledTimes(1);
  });

  it('should return the feedback health status', () => {
    expect(service.getHealth()).toEqual({
      status: 'ok',
      module: 'feedback',
    });
  });
});