import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';

import { NotificationsService } from './notifications.service.js';
import { SubscribeNotificationDto } from './dto/subscribe-notification.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { SendTestNotificationDto } from './dto/send-test-notification.dto.js';

const DEFAULT_TEST_TITLE = 'HireDesk test notification';
const DEFAULT_TEST_BODY =
  'Firebase Cloud Messaging is working. You can close this message.';

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

  /**
   * Sends a push to the caller's own browsers, so an admin can verify delivery
   * end to end. The recipient is the verified subject of the token: the body
   * has no user id field at all, and the global ValidationPipe rejects one.
   */
  @Post('test')
  @Roles('ADMIN')
  sendTestNotification(
    @Body() dto: SendTestNotificationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.notificationsService.sendToUser(
      request.user.sub,
      dto.title ?? DEFAULT_TEST_TITLE,
      dto.body ?? DEFAULT_TEST_BODY,
    );
  }
}