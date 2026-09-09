import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { db } from '../prisma/db.js';
import { CreateCandidateDto } from './dto/create-candidate.dto.js';

@Injectable()
export class CandidatesService {
  async create(createCandidateDto: CreateCandidateDto) {
    return await db.orm.public.Candidate.create({
      name: createCandidateDto.name,
      email: createCandidateDto.email,
      phone: createCandidateDto.phone ?? null,
      jobId: createCandidateDto.jobId,
    });
  }

  async findAll() {
    return await db.orm.public.Candidate.all();
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

    return candidate;
  }

  async update(
    id: number,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      jobId?: number;
    },
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