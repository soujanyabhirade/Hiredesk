import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CandidatesService } from './candidates.service.js';

import { CreateCandidateDto } from './dto/create-candidate.dto.js';
import { UpdateCandidateDto } from './dto/update-candidate.dto.js';

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