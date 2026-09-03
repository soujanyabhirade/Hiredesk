import { Injectable } from '@nestjs/common';

import { db } from '../prisma/db.js';

@Injectable()
export class JobsService {
  async getJobs() {
    return await db.orm.public.Job.all();
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