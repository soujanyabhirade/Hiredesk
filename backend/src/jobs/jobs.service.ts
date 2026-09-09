import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { db } from '../prisma/db.js';

@Injectable()
export class JobsService {
  async getJobs() {
    return await db.orm.public.Job.all();
  }

  async getJobById(id: number) {
    const job = await db.orm.public.Job.first({
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
    const job = await db.orm.public.Job.first({
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
    const job = await db.orm.public.Job.first({
      id,
    });

    if (!job) {
      throw new NotFoundException(
        `Job with id ${id} not found`,
      );
    }

    const candidates =
      await db.orm.public.Candidate.all();

    const hasCandidates = candidates.some(
      (candidate) => candidate.jobId === id,
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
      description: data.description ?? null,
      location: data.location ?? null,
    });
  }
}