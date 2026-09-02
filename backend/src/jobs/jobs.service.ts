import { Injectable } from '@nestjs/common';

@Injectable()
export class JobsService {
  getJobs() {
    return [];
  }

  getHealth() {
    return {
      status: 'ok',
      module: 'jobs',
    };
  }
}