import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

import { RolesGuard } from '../auth/guards/roles.guard.js';

import { Roles } from '../auth/decorators/roles.decorator.js';

import { FeedbackService } from './feedback.service.js';
import { CreateFeedbackDto } from './dto/create-feedback.dto.js';
import { UpdateFeedbackDto } from './dto/update-feedback.dto.js';

@Controller('feedback')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'RECRUITER', 'INTERVIEWER')
export class FeedbackController {
  constructor(
    private readonly feedbackService: FeedbackService,
  ) {}

  @Post()
  create(@Body() feedback: CreateFeedbackDto) {
    return this.feedbackService.create(
      feedback,
    );
  }

  @Get()
  findAll() {
    return this.feedbackService.findAll();
  }

  @Get('health')
  getHealth() {
    return this.feedbackService.getHealth();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.feedbackService.findOne(Number(id));
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() feedback: UpdateFeedbackDto,
  ) {
    return this.feedbackService.update(
      Number(id),
      feedback,
    );
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.feedbackService.delete(
      Number(id),
    );
  }

}