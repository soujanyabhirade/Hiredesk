import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { FeedbackService } from './feedback.service.js';

@Controller('feedback')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'INTERVIEWER')
export class FeedbackController {
  constructor(
    private readonly feedbackService: FeedbackService,
  ) {}

  @Post()
  create(@Body() feedback: any) {
    return this.feedbackService.create(feedback);
  }

  @Get()
  findAll() {
    return this.feedbackService.findAll();
  }

  @Get('health')
  getHealth() {
    return this.feedbackService.getHealth();
  }
}
