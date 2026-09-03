import { Injectable } from '@nestjs/common';
import { CreateCandidateDto } from './dto/create-candidate.dto.js';

@Injectable()
export class CandidatesService {
  private readonly candidates: CreateCandidateDto[] = [];

  create(createCandidateDto: CreateCandidateDto) {
    this.candidates.push(createCandidateDto);

    return createCandidateDto;
  }

  findAll() {
    return this.candidates;
  }

  getHealth() {
    return {
      status: 'ok',
      module: 'candidates',
    };
  }
}