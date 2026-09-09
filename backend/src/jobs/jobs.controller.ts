import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';

import { JobsService } from './jobs.service.js';

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
  ) {}

  @Get()
  async getJobs() {
    return await this.jobsService.getJobs();
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
    @Body()
    body: {
      title?: string;
      description?: string;
      location?: string;
      status?: string;
    },
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
  async createJob(
    @Body()
    body: {
      title: string;
      description?: string;
      location?: string;
    },
  ) {
    return await this.jobsService.create(body);
  }
}