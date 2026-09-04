#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/917dddc94c17e62387a574ab5b76d68d35ae27cf3706f11c0afac4782156323f/contract';
import startContract from '../../snapshots/917dddc94c17e62387a574ab5b76d68d35ae27cf3706f11c0afac4782156323f/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/bef7a80982eaca7d23e9443875f4385bedcf6547e2efe1c50772f86f473ffd0f/contract';
import endContract from '../../snapshots/bef7a80982eaca7d23e9443875f4385bedcf6547e2efe1c50772f86f473ffd0f/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'user',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('password', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('refreshTokenHash', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_email_key',
        columns: ['email'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
