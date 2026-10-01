import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { db } from '../prisma/db.js';
import { JobsService } from '../jobs/jobs.service.js';
import { CreateCandidateDto } from './dto/create-candidate.dto.js';
import { UpdateCandidateDto } from './dto/update-candidate.dto.js';
import {
  parseCandidateCsv,
  serializeCandidateCsv,
  type CandidateCsvImportError,
  type CandidateCsvParsedRow,
} from './csv/candidates-csv.util.js';

type CsvJob = {
  id: number;
  title: string;
};

@Injectable()
export class CandidatesService {
  constructor(
    private readonly jobsService: JobsService,
  ) {}

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

    const existingCandidate =
      await db.orm.public.Candidate.first({
        email: createCandidateDto.email,
        jobId: createCandidateDto.jobId,
      });

    if (existingCandidate) {
      throw new ConflictException(
        `Candidate with email ${createCandidateDto.email} already exists for this job`,
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

  /**
   * Returns the candidates as CSV text, using the same filters as findAll
   * so an export can match what the user is currently looking at.
   */
  async exportCsv(
    jobId?: number,
    search = '',
  ): Promise<string> {
    const [candidates, jobs] =
      await Promise.all([
        db.orm.public.Candidate.all(),
        db.orm.public.Job.all(),
      ]);

    const searchTerm =
      search.trim().toLowerCase();

    const jobTitles = new Map<number, string>(
      jobs.map((job) => [job.id, job.title]),
    );

    const filteredCandidates =
      candidates.filter((candidate) => {
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

    const sortedCandidates = [
      ...filteredCandidates,
    ].sort(
      (a, b) =>
        a.name.localeCompare(b.name) ||
        a.id - b.id,
    );

    return serializeCandidateCsv(
      sortedCandidates.map((candidate) => ({
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone ?? null,
        jobId: candidate.jobId,
        jobTitle:
          jobTitles.get(candidate.jobId) ??
          null,
      })),
    );
  }

  /**
   * Reads a candidate CSV file and creates one candidate per valid row.
   *
   * Rows are validated with the same rules as POST /candidates and each row
   * is created through this.create(), so the import never bypasses the
   * existing business rules. A row that fails is reported and the remaining
   * rows are still imported.
   *
   * When a row carries only a jobTitle and no job that title belongs to, the
   * job is created through JobsService so the candidate still gets linked to
   * a real job.
   */
  async importCsv(content: string) {
    const { rows } = parseCandidateCsv(content);

    const jobs: CsvJob[] =
      await db.orm.public.Job.all();

    const jobsById = new Map<number, CsvJob>(
      jobs.map((job) => [job.id, job]),
    );

    const jobsByTitle = new Map<
      string,
      CsvJob[]
    >();

    jobs.forEach((job) => {
      const key = job.title.trim().toLowerCase();

      const matches = jobsByTitle.get(key) ?? [];

      matches.push(job);

      jobsByTitle.set(key, matches);
    });

    const errors: CandidateCsvImportError[] =
      [];

    let imported = 0;

    for (const row of rows) {
      try {
        const jobId = await this.resolveCsvJobId(
          row,
          jobsById,
          jobsByTitle,
        );

        const createCandidateDto =
          plainToInstance(
            CreateCandidateDto,
            {
              name: row.name,
              email: row.email,
              phone: row.phone,
              jobId,
            },
          );

        const validationErrors =
          await validate(createCandidateDto);

        if (validationErrors.length > 0) {
          throw new BadRequestException(
            validationErrors
              .flatMap((error) =>
                Object.values(
                  error.constraints ?? {},
                ),
              )
              .join(', '),
          );
        }

        await this.create(createCandidateDto);

        imported += 1;
      } catch (error) {
        errors.push({
          row: row.row,
          message:
            error instanceof Error
              ? error.message
              : 'Unknown error',
        });
      }
    }

    return {
      totalRows: rows.length,
      imported,
      failed: errors.length,
      errors,
    };
  }

  /**
   * Works out which job a CSV row belongs to.
   *
   * When the row supplies a jobId that job must exist, and when the row also
   * supplies a jobTitle the two have to agree. An unknown jobId is always an
   * error: the job is never created from the title in that case, because the
   * row has already asserted an explicit id that does not exist.
   *
   * When the row supplies only a jobTitle, an existing job with that title is
   * reused. If the title is not taken yet, the job is created and written back
   * into both lookup maps so later rows in the same file reuse it instead of
   * creating a duplicate.
   */
  private async resolveCsvJobId(
    row: CandidateCsvParsedRow,
    jobsById: Map<number, CsvJob>,
    jobsByTitle: Map<string, CsvJob[]>,
  ): Promise<number> {
    if (row.jobId !== undefined) {
      const job = jobsById.get(row.jobId);

      if (!job) {
        throw new BadRequestException(
          `Job with id ${row.jobId} not found`,
        );
      }

      if (
        row.jobTitle &&
        job.title.trim().toLowerCase() !==
          row.jobTitle.trim().toLowerCase()
      ) {
        throw new BadRequestException(
          `jobId ${row.jobId} does not match jobTitle "${row.jobTitle}"`,
        );
      }

      return job.id;
    }

    const jobTitle = row.jobTitle ?? '';

    const titleKey =
      jobTitle.trim().toLowerCase();

    const matches =
      jobsByTitle.get(titleKey) ?? [];

    if (matches.length === 0) {
      const createdJob = await this.jobsService.create(
        { title: jobTitle },
      );

      const created = {
        id: createdJob.id,
        title: createdJob.title,
      };

      jobsById.set(created.id, created);

      jobsByTitle.set(titleKey, [created]);

      return created.id;
    }

    if (matches.length > 1) {
      throw new BadRequestException(
        `Multiple jobs are titled "${jobTitle}". Use jobId instead.`,
      );
    }

    return matches[0].id;
  }

  getHealth() {
    return {
      status: 'ok',
      module: 'candidates',
    };
  }
}