import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { InterviewsService } from './interviews.service.js';

@Controller('interviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'RECRUITER', 'INTERVIEWER')
export class InterviewsController {
  constructor(
    private readonly interviewsService: InterviewsService,
  ) {}

  @Post()
  create(@Body() interview: any) {
    return this.interviewsService.create(interview);
  }

  @Get()
  findAll() {
    return this.interviewsService.findAll();
  }

  @Get('health')
  getHealth() {
    return this.interviewsService.getHealth();
  }
}
