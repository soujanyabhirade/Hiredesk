import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { CandidatesModule } from './candidates/candidates.module.js';
import { JobsModule } from './jobs/jobs.module.js';
import { InterviewsModule } from './interviews/interviews.module.js';
import { FeedbackModule } from './feedback/feedback.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [
    CandidatesModule,
    JobsModule,
    InterviewsModule,
    FeedbackModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}