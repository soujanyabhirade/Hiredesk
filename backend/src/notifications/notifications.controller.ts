import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';

import { NotificationsService } from './notifications.service.js';
import { SubscribeNotificationDto } from './dto/subscribe-notification.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

type AuthenticatedRequest = {
  user: { sub: number; email: string; role: string };
};

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * No @Roles() restriction: every authenticated role may subscribe. The user
   * is taken only from the verified token, so no client-supplied user id is
   * ever trusted (the DTO does not expose one either).
   */
  @Post('subscribe')
  subscribe(
    @Body() dto: SubscribeNotificationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.notificationsService.subscribe(dto, request.user.sub);
  }
}