import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { db } from '../prisma/db.js';
import { CreateInterviewDto } from './dto/create-interview.dto.js';
import { UpdateInterviewDto } from './dto/update-interview.dto.js';

interface CreateInterviewInput {
  candidateId: number;
  scheduledAt: string;
  status?: string;
}

interface UpdateInterviewInput {
  candidateId?: number;
  scheduledAt?: string;
  status?: string;
}

@Injectable()
export class InterviewsService {
  async create(
    interview: CreateInterviewDto,
  ) {
    const candidate = await db.orm.public.Candidate.first({
      id: interview.candidateId,
    });

    if (!candidate) {
      throw new NotFoundException(
        `Candidate with id ${interview.candidateId} not found`,
      );
    }

    return db.orm.public.Interview.create({
      candidateId:
        interview.candidateId,
      scheduledAt:
        interview.scheduledAt,
      ...(interview.status
        ? {
            status:
              interview.status,
          }
        : {}),
    });
  }

  async findAll(
    status?: string,
    sort?: string,
  ) {
    const statusFilter =
      status?.trim().toLowerCase() || '';

    const sortOption =
      sort?.trim() || 'newest';

    const allInterviews =
      await db.orm.public.Interview.all();

    let filteredInterviews =
      allInterviews.filter(
        (interview) => {
          if (!statusFilter) {
            return true;
          }

          return (
            interview.status.toLowerCase() ===
            statusFilter
          );
        },
      );

    filteredInterviews =
      [...filteredInterviews].sort(
        (a, b) => {
          if (sortOption === 'oldest') {
            return (
              new Date(
                a.scheduledAt,
              ).getTime() -
              new Date(
                b.scheduledAt,
              ).getTime()
            );
          }

          if (sortOption === 'statusAsc') {
            return a.status.localeCompare(
              b.status,
            );
          }

          return (
            new Date(
              b.scheduledAt,
            ).getTime() -
            new Date(
              a.scheduledAt,
            ).getTime()
          );
        },
      );

    return filteredInterviews;
  }

  async update(
    id: number,
    interview: UpdateInterviewDto,
  ) {
    const existingInterview =
      await db.orm.public.Interview.first({
        id,
      });

    if (!existingInterview) {
      throw new NotFoundException(
        `Interview with id ${id} not found`,
      );
    }

    if (interview.candidateId !== undefined) {
      const candidate = await db.orm.public.Candidate.first({
        id: interview.candidateId,
      });

      if (!candidate) {
        throw new NotFoundException(
          `Candidate with id ${interview.candidateId} not found`,
        );
      }
    }

    return await db.orm.public.Interview
      .where({ id })
      .update({
        ...(interview.candidateId !==
        undefined
          ? {
              candidateId:
                interview.candidateId,
            }
          : {}),
        ...(interview.scheduledAt !==
        undefined
          ? {
              scheduledAt:
                interview.scheduledAt,
            }
          : {}),
        ...(interview.status !==
        undefined
          ? {
              status:
                interview.status,
            }
          : {}),
      });
  }

  async delete(id: number) {
    const existingInterview =
      await db.orm.public.Interview.first({
        id,
      });

    if (!existingInterview) {
      throw new NotFoundException(
        `Interview with id ${id} not found`,
      );
    }

    await db.orm.public.Interview
      .where({ id })
      .delete();

    return {
      message: `Interview with id ${id} deleted successfully`,
    };
  }

  getHealth() {
    return {
      status: 'ok',
      module: 'interviews',
    };
  }
}