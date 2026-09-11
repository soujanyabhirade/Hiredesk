import { FeedbackService } from './feedback.service.js';
import { NotFoundException } from '@nestjs/common';

jest.mock('../prisma/db.js', () => ({
  db: {
    orm: {
      public: {
        Feedback: {
          create: jest.fn(),
          all: jest.fn(),
          first: jest.fn(),
          where: jest.fn(),
        },
        Interview: {
          first: jest.fn(),
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

    (
      db.orm.public.Interview.first as jest.Mock
    ).mockResolvedValue({ id: 1 });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // -------------------------------------------------------
  // CREATE
  // -------------------------------------------------------

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

  // -------------------------------------------------------
  // FIND ALL
  // -------------------------------------------------------

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

  // -------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------

  it('should update feedback when feedback exists', async () => {
    const existingFeedback = {
      id: 1,
      interviewId: 1,
      rating: 3,
      comments: 'Average interview',
    };

    const updatedFeedback = {
      id: 1,
      interviewId: 2,
      rating: 5,
      comments: 'Excellent interview',
    };

    (
      db.orm.public.Feedback.first as jest.Mock
    ).mockResolvedValue(existingFeedback);

    const updateMock = jest.fn().mockResolvedValue(updatedFeedback);

    (
      db.orm.public.Feedback.where as jest.Mock
    ).mockReturnValue({
      update: updateMock,
    });

    const result = await service.update(1, {
      interviewId: 2,
      rating: 5,
      comments: 'Excellent interview',
    });

    expect(result).toEqual(updatedFeedback);

    expect(
      db.orm.public.Feedback.first,
    ).toHaveBeenCalledWith({
      id: 1,
    });

    expect(
      db.orm.public.Feedback.where,
    ).toHaveBeenCalledWith({
      id: 1,
    });

    expect(updateMock).toHaveBeenCalledWith({
      interviewId: 2,
      rating: 5,
      comments: 'Excellent interview',
    });
  });

  it('should update only the provided feedback fields', async () => {
    const existingFeedback = {
      id: 1,
      interviewId: 1,
      rating: 3,
      comments: 'Average interview',
    };

    const updatedFeedback = {
      ...existingFeedback,
      rating: 4,
    };

    (
      db.orm.public.Feedback.first as jest.Mock
    ).mockResolvedValue(existingFeedback);

    const updateMock = jest.fn().mockResolvedValue(updatedFeedback);

    (
      db.orm.public.Feedback.where as jest.Mock
    ).mockReturnValue({
      update: updateMock,
    });

    const result = await service.update(1, {
      rating: 4,
    });

    expect(result).toEqual(updatedFeedback);

    expect(updateMock).toHaveBeenCalledWith({
      rating: 4,
    });
  });

  it('should throw NotFoundException when updating non-existent feedback', async () => {
    (
      db.orm.public.Feedback.first as jest.Mock
    ).mockResolvedValue(null);

    await expect(
      service.update(999, {
        rating: 5,
      }),
    ).rejects.toThrow(
      new NotFoundException(
        'Feedback with id 999 not found',
      ),
    );

    expect(
      db.orm.public.Feedback.first,
    ).toHaveBeenCalledWith({
      id: 999,
    });

    expect(
      db.orm.public.Feedback.where,
    ).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------
  // DELETE
  // -------------------------------------------------------

  it('should delete feedback when feedback exists', async () => {
    const existingFeedback = {
      id: 1,
      interviewId: 1,
      rating: 4,
      comments: 'Good interview',
    };

    (
      db.orm.public.Feedback.first as jest.Mock
    ).mockResolvedValue(existingFeedback);

    const deleteMock = jest.fn().mockResolvedValue(undefined);

    (
      db.orm.public.Feedback.where as jest.Mock
    ).mockReturnValue({
      delete: deleteMock,
    });

    const result = await service.delete(1);

    expect(result).toEqual({
      message: 'Feedback with id 1 deleted successfully',
    });

    expect(
      db.orm.public.Feedback.first,
    ).toHaveBeenCalledWith({
      id: 1,
    });

    expect(
      db.orm.public.Feedback.where,
    ).toHaveBeenCalledWith({
      id: 1,
    });

    expect(deleteMock).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFoundException when deleting non-existent feedback', async () => {
    (
      db.orm.public.Feedback.first as jest.Mock
    ).mockResolvedValue(null);

    await expect(
      service.delete(999),
    ).rejects.toThrow(
      new NotFoundException(
        'Feedback with id 999 not found',
      ),
    );

    expect(
      db.orm.public.Feedback.first,
    ).toHaveBeenCalledWith({
      id: 999,
    });

    expect(
      db.orm.public.Feedback.where,
    ).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------
  // HEALTH
  // -------------------------------------------------------

  it('should return the feedback health status', () => {
    expect(service.getHealth()).toEqual({
      status: 'ok',
      module: 'feedback',
    });
  });
});