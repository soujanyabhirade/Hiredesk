import { Body, Controller, Get, Post } from '@nestjs/common';
import { CandidatesService } from './candidates.service.js';
import { CreateCandidateDto } from './dto/create-candidate.dto.js';

@Controller('candidates')
export class CandidatesController {
  constructor(
    private readonly candidatesService: CandidatesService,
  ) {}

  @Post()
  create(@Body() createCandidateDto: CreateCandidateDto) {
    return this.candidatesService.create(createCandidateDto);
  }

  @Get()
  findAll() {
    return this.candidatesService.findAll();
  }

  @Get('health')
  getHealth() {
    return this.candidatesService.getHealth();
  }
}