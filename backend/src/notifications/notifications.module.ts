import { Module } from '@nestjs/common';

import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, JwtAuthGuard, RolesGuard],
  exports: [NotificationsService],
})
export class NotificationsModule {}