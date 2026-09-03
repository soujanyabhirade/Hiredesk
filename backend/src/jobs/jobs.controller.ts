import {
  Body,
  Controller,
  Get,
  Post,
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