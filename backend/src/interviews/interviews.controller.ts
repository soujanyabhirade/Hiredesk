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

import { InterviewsService } from './interviews.service.js';
import { CreateInterviewDto } from './dto/create-interview.dto.js';
import { UpdateInterviewDto } from './dto/update-interview.dto.js';

@Controller('interviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'RECRUITER', 'INTERVIEWER')
export class InterviewsController {
  constructor(
    private readonly interviewsService: InterviewsService,
  ) {}

  @Post()
  create(@Body() interview: CreateInterviewDto) {
    return this.interviewsService.create(
      interview,
    );
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('sort') sort?: string,
  ) {
    return this.interviewsService.findAll(
      status || '',
      sort || 'newest',
    );
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() interview: UpdateInterviewDto,
  ) {
    return this.interviewsService.update(
      Number(id),
      interview,
    );
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.interviewsService.delete(
      Number(id),
    );
  }

  @Get('health')
  getHealth() {
    return this.interviewsService.getHealth();
  }
}