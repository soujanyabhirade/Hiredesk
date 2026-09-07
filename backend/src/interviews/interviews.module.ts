import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { InterviewsController } from './interviews.controller.js';
import { InterviewsService } from './interviews.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

@Module({
  imports: [AuthModule],
  controllers: [InterviewsController],
  providers: [
    InterviewsService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [InterviewsService],
})
export class InterviewsModule {}
