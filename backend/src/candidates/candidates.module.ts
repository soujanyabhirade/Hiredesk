import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CandidatesController } from './candidates.controller.js';
import { CandidatesService } from './candidates.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

@Module({
  imports: [AuthModule],
  controllers: [CandidatesController],
  providers: [
    CandidatesService,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class CandidatesModule {}