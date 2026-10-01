import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import type {
  Express,
  Response,
} from 'express';

import { CandidatesService } from './candidates.service.js';

import { CreateCandidateDto } from './dto/create-candidate.dto.js';
import { UpdateCandidateDto } from './dto/update-candidate.dto.js';

import { MAX_CANDIDATE_CSV_FILE_SIZE } from './csv/candidates-csv.util.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('candidates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CandidatesController {
  constructor(
    private readonly candidatesService: CandidatesService,
  ) {}

  @Post()
  @Roles('ADMIN', 'RECRUITER')
  create(
    @Body()
    createCandidateDto: CreateCandidateDto,
  ) {
    return this.candidatesService.create(
      createCandidateDto,
    );
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('jobId') jobId?: string,
    @Query('sort') sort?: string,
  ) {
    return this.candidatesService.findAll(
      Number(page) || 1,
      Number(limit) || 5,
      search || '',
      jobId
        ? Number(jobId)
        : undefined,
      sort || 'newest',
    );
  }

  @Get('health')
  getHealth() {
    return this.candidatesService.getHealth();
  }

  @Post('import')
  @Roles('ADMIN', 'RECRUITER')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize:
          MAX_CANDIDATE_CSV_FILE_SIZE,
      },
    }),
  )
  importCandidates(
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException(
        'A CSV file is required.',
      );
    }

    const filename = (
      file.originalname ?? ''
    ).toLowerCase();

    if (!filename.endsWith('.csv')) {
      throw new BadRequestException(
        'Only .csv files are supported.',
      );
    }

    if (
      !file.buffer ||
      file.buffer.length === 0
    ) {
      throw new BadRequestException(
        'The uploaded CSV file is empty.',
      );
    }

    return this.candidatesService.importCsv(
      file.buffer.toString('utf8'),
    );
  }

  @Get('export')
  async exportCandidates(
    @Res() response: Response,
    @Query('jobId') jobId?: string,
    @Query('search') search?: string,
  ) {
    const csv = await this.candidatesService.exportCsv(
      jobId ? Number(jobId) : undefined,
      search || '',
    );

    const date = new Date()
      .toISOString()
      .slice(0, 10);

    response.setHeader(
      'Content-Type',
      'text/csv; charset=utf-8',
    );

    response.setHeader(
      'Content-Disposition',
      `attachment; filename="hiredesk-candidates-${date}.csv"`,
    );

    // The byte order mark makes Excel open the file as UTF-8.
    return response.send(`\uFEFF${csv}`);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.candidatesService.findOne(
      Number(id),
    );
  }

  @Put(':id')
  @Roles('ADMIN', 'RECRUITER')
  update(
    @Param('id') id: string,
    @Body()
    updateCandidateDto: UpdateCandidateDto,
  ) {
    return this.candidatesService.update(
      Number(id),
      updateCandidateDto,
    );
  }

  @Delete(':id')
  @Roles('ADMIN', 'RECRUITER')
  delete(
    @Param('id') id: string,
  ) {
    return this.candidatesService.delete(
      Number(id),
    );
  }
}