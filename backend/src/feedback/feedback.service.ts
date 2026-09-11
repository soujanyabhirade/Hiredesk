import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { db } from '../prisma/db.js';
import { CreateFeedbackDto } from './dto/create-feedback.dto.js';
import { UpdateFeedbackDto } from './dto/update-feedback.dto.js';

interface CreateFeedbackInput {
  interviewId: number;
  rating: number;
  comments?: string;
}

interface UpdateFeedbackInput {
  interviewId?: number;
  rating?: number;
  comments?: string;
}

@Injectable()
export class FeedbackService {
  async create(
    feedback: CreateFeedbackDto,
  ) {
    const interview = await db.orm.public.Interview.first({
      id: feedback.interviewId,
    });

    if (!interview) {
      throw new NotFoundException(
        `Interview with id ${feedback.interviewId} not found`,
      );
    }

    return db.orm.public.Feedback.create({
      interviewId:
        feedback.interviewId,

      rating: feedback.rating,

      ...(feedback.comments
        ? {
            comments:
              feedback.comments,
          }
        : {}),
    });
  }

  async findAll() {
    return db.orm.public.Feedback.all();
  }

  async findOne(id: number) {
    const feedback = await db.orm.public.Feedback.first({
      id,
    });

    if (!feedback) {
      throw new NotFoundException(
        `Feedback with id ${id} not found`,
      );
    }

    return feedback;
  }

  async update(
    id: number,
    feedback: UpdateFeedbackDto,
  ) {
    const existingFeedback =
      await db.orm.public.Feedback.first({
        id,
      });

    if (!existingFeedback) {
      throw new NotFoundException(
        `Feedback with id ${id} not found`,
      );
    }

    if (feedback.interviewId !== undefined) {
      const interview = await db.orm.public.Interview.first({
        id: feedback.interviewId,
      });

      if (!interview) {
        throw new NotFoundException(
          `Interview with id ${feedback.interviewId} not found`,
        );
      }
    }

    return await db.orm.public.Feedback
      .where({ id })
      .update({
        ...(feedback.interviewId !==
        undefined
          ? {
              interviewId:
                feedback.interviewId,
            }
          : {}),

        ...(feedback.rating !==
        undefined
          ? {
              rating:
                feedback.rating,
            }
          : {}),

        ...(feedback.comments !==
        undefined
          ? {
              comments:
                feedback.comments,
            }
          : {}),
      });
  }

  async delete(id: number) {
    const existingFeedback =
      await db.orm.public.Feedback.first({
        id,
      });

    if (!existingFeedback) {
      throw new NotFoundException(
        `Feedback with id ${id} not found`,
      );
    }

    await db.orm.public.Feedback
      .where({ id })
      .delete();

    return {
      message: `Feedback with id ${id} deleted successfully`,
    };
  }

  getHealth() {
    return {
      status: 'ok',
      module: 'feedback',
    };
  }
}