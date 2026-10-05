import { Injectable } from '@nestjs/common';

import { db } from '../prisma/db.js';
import { getFirebaseMessaging } from './firebase-admin.js';
import { SubscribeNotificationDto } from './dto/subscribe-notification.dto.js';

/** Postgres SQLSTATE for unique_violation. */
const UNIQUE_VIOLATION_SQLSTATE = '23505';

/**
 * FCM error codes that mean the token itself is unusable, so keeping it would
 * only make every later send fail again. Everything else (internal-error,
 * quota-exceeded, unavailable, ...) is transient and keeps the token.
 */
const PERMANENT_TOKEN_ERROR_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-argument',
  'messaging/invalid-registration-token',
]);

/**
 * The ORM normalizes driver errors but keeps the original on `cause`, and a
 * concurrent insert of the same token surfaces either as a raw pg error or as
 * a wrapped one. Walk the whole chain so the race is handled in either case.
 */
function isUniqueViolation(error: unknown): boolean {
  const visited = new Set<unknown>();
  let current: unknown = error;

  while (current !== null && typeof current === 'object' && !visited.has(current)) {
    visited.add(current);

    const candidate = current as {
      code?: unknown;
      constraint?: unknown;
      message?: unknown;
      cause?: unknown;
    };

    if (candidate.code === UNIQUE_VIOLATION_SQLSTATE) {
      return true;
    }

    if (typeof candidate.code === 'string' && /CONSTRAINT|UNIQUE/i.test(candidate.code)) {
      return true;
    }

    if (candidate.constraint !== undefined) {
      return true;
    }

    if (
      typeof candidate.message === 'string' &&
      /unique|duplicate key/i.test(candidate.message)
    ) {
      return true;
    }

    current = candidate.cause;
  }

  return false;
}

@Injectable()
export class NotificationsService {
  /**
   * Associates an FCM registration token with the authenticated user.
   *
   * The user always comes from the verified JWT, never from the payload. One
   * user may hold several tokens (one per browser/device), and a token that
   * changes hands is reassigned so a row always reflects its current owner.
   */
  async subscribe(dto: SubscribeNotificationDto, userId: number) {
    const platform = dto.platform ?? 'web';

    const stored = await this.storeToken(dto.token, platform, userId);

    return {
      id: stored.id,
      platform: stored.platform,
      createdAt: stored.createdAt,
      updatedAt: stored.updatedAt,
    };
  }

  /**
   * Pushes a notification to every browser the given user has subscribed.
   *
   * One user may hold several tokens (one per browser or device), so all of
   * them are targeted in a single multicast request. A token that FCM reports
   * as permanently invalid is deleted so later sends stop paying for it.
   */
  async sendToUser(
    userId: number,
    title: string,
    body: string,
  ): Promise<{ sent: number; failed: number; pruned: number }> {
    const tokens = await db.orm.public.PushToken.where({ userId }).all();

    if (tokens.length === 0) {
      return { sent: 0, failed: 0, pruned: 0 };
    }

    const { responses } = await getFirebaseMessaging().sendEachForMulticast({
      tokens: tokens.map((row) => row.token),
      notification: {
        title,
        body,
      },
    });

    let sent = 0;
    let failed = 0;
    let pruned = 0;

    for (const [index, response] of responses.entries()) {
      if (response.success) {
        sent += 1;
        continue;
      }

      failed += 1;

      const code = response.error?.code;

      if (code !== undefined && PERMANENT_TOKEN_ERROR_CODES.has(code)) {
        await db.orm.public.PushToken.where({
          token: tokens[index].token,
        }).delete();

        pruned += 1;
      }
    }

    return { sent, failed, pruned };
  }

  private async storeToken(
    token: string,
    platform: string,
    userId: number,
  ): Promise<PushTokenRecord> {
    const existing = await db.orm.public.PushToken.first({ token });

    if (existing) {
      await db.orm.public.PushToken.where({ id: existing.id }).update({
        userId,
        platform,
      });

      const refreshed = await db.orm.public.PushToken.first({ id: existing.id });

      if (!refreshed) {
        throw new Error(`PushToken ${existing.id} disappeared during update`);
      }

      return refreshed;
    }

    try {
      return await db.orm.public.PushToken.create({ token, platform, userId });
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }

      // Lost a race against a concurrent subscribe for the same token. The
      // winner's row is authoritative, so adopt it rather than failing.
      const raced = await db.orm.public.PushToken.first({ token });

      if (!raced) {
        throw error;
      }

      await db.orm.public.PushToken.where({ id: raced.id }).update({
        userId,
        platform,
      });

      const refreshed = await db.orm.public.PushToken.first({ id: raced.id });

      if (!refreshed) {
        throw new Error(`PushToken ${raced.id} disappeared during update`);
      }

      return refreshed;
    }
  }
}

type PushTokenRecord = {
  id: number;
  platform: string;
  createdAt: string;
  updatedAt: string;
};