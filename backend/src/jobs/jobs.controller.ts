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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

import { JobsService } from './jobs.service.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { UpdateJobDto } from './dto/update-job.dto.js';

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
  ) {}

  @Get()
  async getJobs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('sort') sort?: string,
  ) {
    return await this.jobsService.getJobs(
      Number(page) || 1,
      Number(limit) || 5,
      search || '',
      status || '',
      sort || 'newest',
    );
  }

  @Get('health')
  getHealth() {
    return this.jobsService.health();
  }

  @Get(':id')
  async getJobById(
    @Param('id') id: string,
  ) {
    return await this.jobsService.getJobById(
      Number(id),
    );
  }

  @Put(':id')
  async updateJob(
    @Param('id') id: string,
    @Body() body: UpdateJobDto,
  ) {
    return await this.jobsService.updateJob(
      Number(id),
      body,
    );
  }

  @Delete(':id')
  async deleteJob(
    @Param('id') id: string,
  ) {
    return await this.jobsService.deleteJob(
      Number(id),
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'RECRUITER')
  async createJob(
    @Body() body: CreateJobDto,
  ) {
    return await this.jobsService.create(body);
  }
}