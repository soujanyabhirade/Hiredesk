import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { db } from '../prisma/db.js';

@Injectable()
export class JobsService {
  async getJobs(
    page = 1,
    limit = 5,
    search = '',
    status?: string,
    sort = 'newest',
  ) {
    const safePage = Math.max(1, page);

    const safeLimit = Math.min(
      Math.max(1, limit),
      50,
    );

    const searchTerm =
      search.trim().toLowerCase();

    const statusFilter =
      status?.trim().toLowerCase() || '';

    const allJobs =
      await db.orm.public.Job.all();

    const filteredJobs =
      allJobs.filter((job) => {
        const matchesSearch =
          !searchTerm ||
          job.title
            .toLowerCase()
            .includes(searchTerm) ||
          job.description
            ?.toLowerCase()
            .includes(searchTerm) ||
          job.location
            ?.toLowerCase()
            .includes(searchTerm);

        const matchesStatus =
          !statusFilter ||
          job.status.toLowerCase() ===
            statusFilter;

        return (
          Boolean(matchesSearch) &&
          matchesStatus
        );
      });

    const sortedJobs =
      [...filteredJobs].sort(
        (a, b) => {
          switch (sort) {
            case 'oldest':
              return (
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
              );

            case 'titleAsc':
              return a.title.localeCompare(
                b.title,
              );

            case 'titleDesc':
              return b.title.localeCompare(
                a.title,
              );

            case 'newest':
            default:
              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
          }
        },
      );

    const offset =
      (safePage - 1) * safeLimit;

    const jobs = sortedJobs.slice(
      offset,
      offset + safeLimit,
    );

    return {
      data: jobs,
      page: safePage,
      limit: safeLimit,
      search: searchTerm,
      status: statusFilter || null,
      sort,
      total: filteredJobs.length,
    };
  }

  async getJobById(id: number) {
    const job =
      await db.orm.public.Job.first({
        id,
      });

    if (!job) {
      throw new NotFoundException(
        `Job with id ${id} not found`,
      );
    }

    return job;
  }

  async updateJob(
    id: number,
    data: {
      title?: string;
      description?: string;
      location?: string;
      status?: string;
    },
  ) {
    const job =
      await db.orm.public.Job.first({
        id,
      });

    if (!job) {
      throw new NotFoundException(
        `Job with id ${id} not found`,
      );
    }

    return await db.orm.public.Job
      .where({ id })
      .update({
        ...(data.title !== undefined
          ? { title: data.title }
          : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.location !== undefined
          ? { location: data.location }
          : {}),
        ...(data.status !== undefined
          ? { status: data.status }
          : {}),
      });
  }

  async deleteJob(id: number) {
    const job =
      await db.orm.public.Job.first({
        id,
      });

    if (!job) {
      throw new NotFoundException(
        `Job with id ${id} not found`,
      );
    }

    const candidates =
      await db.orm.public.Candidate.all();

    const hasCandidates =
      candidates.some(
        (candidate) =>
          candidate.jobId === id,
      );

    if (hasCandidates) {
      throw new ConflictException(
        `Job with id ${id} cannot be deleted because candidates are linked to it`,
      );
    }

    await db.orm.public.Job
      .where({ id })
      .delete();

    return {
      message: `Job with id ${id} deleted successfully`,
    };
  }

  health() {
    return {
      status: 'ok',
      module: 'jobs',
    };
  }

  async create(data: {
    title: string;
    description?: string;
    location?: string;
  }) {
    return await db.orm.public.Job.create({
      title: data.title,
      description:
        data.description ?? null,
      location:
        data.location ?? null,
    });
  }
}