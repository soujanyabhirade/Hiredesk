import { Injectable } from '@nestjs/common';
import { db } from '../prisma/db.js';

interface CreateInterviewInput {
  candidateId: number;
  scheduledAt: string;
  status?: string;
}

@Injectable()
export class InterviewsService {
  async create(interview: CreateInterviewInput) {
    return db.orm.public.Interview.create({
      candidateId: interview.candidateId,
      scheduledAt: interview.scheduledAt,
      ...(interview.status
        ? { status: interview.status }
        : {}),
    });
  }

  async findAll() {
    return db.orm.public.Interview.all();
  }

  getHealth() {
    return {
      status: 'ok',
      module: 'interviews',
    };
  }
}