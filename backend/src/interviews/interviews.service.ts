import { Injectable } from '@nestjs/common';

@Injectable()
export class InterviewsService {
  private readonly interviews: any[] = [];

  create(interview: any) {
    this.interviews.push(interview);
    return interview;
  }

  findAll() {
    return this.interviews;
  }

  getHealth() {
    return {
      status: 'ok',
      module: 'interviews',
    };
  }
}