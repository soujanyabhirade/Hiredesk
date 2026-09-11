import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { db } from '../prisma/db.js';
import { CreateCandidateDto } from './dto/create-candidate.dto.js';
import { UpdateCandidateDto } from './dto/update-candidate.dto.js';

@Injectable()
export class CandidatesService {
  async create(
    createCandidateDto: CreateCandidateDto,
  ) {
    const job = await db.orm.public.Job.first({
      id: createCandidateDto.jobId,
    });

    if (!job) {
      throw new NotFoundException(
        `Job with id ${createCandidateDto.jobId} not found`,
      );
    }

    return await db.orm.public.Candidate.create({
      name: createCandidateDto.name,
      email: createCandidateDto.email,
      phone: createCandidateDto.phone ?? null,
      jobId: createCandidateDto.jobId,
    });
  }

  async findAll(
    page = 1,
    limit = 5,
    search = '',
    jobId?: number,
    sort = 'newest',
  ) {
    const safePage = Math.max(1, page);

    const safeLimit = Math.min(
      Math.max(1, limit),
      50,
    );

    const searchTerm =
      search.trim().toLowerCase();

    const allCandidates =
      await db.orm.public.Candidate.all();

    const filteredCandidates =
      allCandidates.filter((candidate) => {
        const matchesSearch =
          !searchTerm ||
          candidate.name
            .toLowerCase()
            .includes(searchTerm) ||
          candidate.email
            .toLowerCase()
            .includes(searchTerm);

        const matchesJob =
          jobId === undefined ||
          candidate.jobId === jobId;

        return matchesSearch && matchesJob;
      });

    const sortedCandidates =
      [...filteredCandidates].sort(
        (a, b) => {
          switch (sort) {
            case 'name':
              return a.name.localeCompare(
                b.name,
              );

            case 'email':
              return a.email.localeCompare(
                b.email,
              );

            case 'jobId':
              return a.jobId - b.jobId;

            case 'newest':
            default:
              return (
                new Date(
                  b.createdAt,
                ).getTime() -
                new Date(
                  a.createdAt,
                ).getTime()
              );
          }
        },
      );

    const offset =
      (safePage - 1) * safeLimit;

    const candidates =
      sortedCandidates.slice(
        offset,
        offset + safeLimit,
      );

    return {
      data: candidates,
      page: safePage,
      limit: safeLimit,
      search: searchTerm,
      jobId: jobId ?? null,
      sort,
      total: filteredCandidates.length,
    };
  }

  async findOne(id: number) {
    const candidate =
      await db.orm.public.Candidate.first({
        id,
      });

    if (!candidate) {
      throw new NotFoundException(
        `Candidate with id ${id} not found`,
      );
    }

    const job =
      await db.orm.public.Job.first({
        id: candidate.jobId,
      });

    return {
      ...candidate,
      job: job
        ? {
            id: job.id,
            title: job.title,
            location: job.location,
            status: job.status,
          }
        : null,
    };
  }

  async update(
    id: number,
    data: UpdateCandidateDto,
  ) {
    const candidate =
      await db.orm.public.Candidate.first({
        id,
      });

    if (!candidate) {
      throw new NotFoundException(
        `Candidate with id ${id} not found`,
      );
    }

    if (data.jobId !== undefined) {
      const job = await db.orm.public.Job.first({
        id: data.jobId,
      });

      if (!job) {
        throw new NotFoundException(
          `Job with id ${data.jobId} not found`,
        );
      }
    }

    return await db.orm.public.Candidate
      .where({ id })
      .update({
        ...(data.name !== undefined
          ? { name: data.name }
          : {}),
        ...(data.email !== undefined
          ? { email: data.email }
          : {}),
        ...(data.phone !== undefined
          ? { phone: data.phone }
          : {}),
        ...(data.jobId !== undefined
          ? { jobId: data.jobId }
          : {}),
      });
  }

  async delete(id: number) {
    const candidate =
      await db.orm.public.Candidate.first({
        id,
      });

    if (!candidate) {
      throw new NotFoundException(
        `Candidate with id ${id} not found`,
      );
    }

    const interviews =
      await db.orm.public.Interview.all();

    const hasInterviews =
      interviews.some(
        (interview) =>
          interview.candidateId === id,
      );

    if (hasInterviews) {
      throw new ConflictException(
        'This candidate cannot be deleted because they have interviews associated with them.',
      );
    }

    await db.orm.public.Candidate
      .where({ id })
      .delete();

    return {
      message: `Candidate with id ${id} deleted successfully`,
    };
  }

  getHealth() {
    return {
      status: 'ok',
      module: 'candidates',
    };
  }
}