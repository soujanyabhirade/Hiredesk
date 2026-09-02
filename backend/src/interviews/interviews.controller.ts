import { Body, Controller, Get, Post } from '@nestjs/common';
import { InterviewsService } from './interviews.service';

@Controller('interviews')
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