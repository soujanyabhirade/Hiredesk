import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { FeedbackController } from './feedback.controller.js';
import { FeedbackService } from './feedback.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

@Module({
  imports: [AuthModule],
  controllers: [FeedbackController],
  providers: [
    FeedbackService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [FeedbackService],
})
export class FeedbackModule {}
