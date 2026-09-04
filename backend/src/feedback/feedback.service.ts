import { Injectable } from '@nestjs/common';
import { db } from '../prisma/db.js';

interface CreateFeedbackInput {
  interviewId: number;
  rating: number;
  comments?: string;
}

@Injectable()
export class FeedbackService {
  async create(feedback: CreateFeedbackInput) {
    return db.orm.public.Feedback.create({
      interviewId: feedback.interviewId,
      rating: feedback.rating,
      ...(feedback.comments
        ? { comments: feedback.comments }
        : {}),
    });
  }

  async findAll() {
    return db.orm.public.Feedback.all();
  }

  getHealth() {
    return {
      status: 'ok',
      module: 'feedback',
    };
  }
}