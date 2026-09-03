import { Body, Controller, Get, Post } from '@nestjs/common';
import { FeedbackService } from './feedback.service.js';

@Controller('feedback')
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