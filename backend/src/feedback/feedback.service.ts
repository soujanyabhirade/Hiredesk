import { Injectable } from '@nestjs/common';

@Injectable()
export class FeedbackService {
  private readonly feedback: any[] = [];

  create(feedback: any) {
    this.feedback.push(feedback);
    return feedback;
  }

  findAll() {
    return this.feedback;
  }

  getHealth() {
    return {
      status: 'ok',
      module: 'feedback',
    };
  }
}