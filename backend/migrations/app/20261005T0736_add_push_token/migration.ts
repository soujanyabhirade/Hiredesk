#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/d2d8e3e5f37355984315a3fffc65c90b761e47790dc8ebe4c4571378b1bc23c1/contract';
import endContract from '../../snapshots/d2d8e3e5f37355984315a3fffc65c90b761e47790dc8ebe4c4571378b1bc23c1/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/e689286962601a1be3305f9be270a2d82f86039f6ebc78e714fef7f6334c9bd3/contract';
import startContract from '../../snapshots/e689286962601a1be3305f9be270a2d82f86039f6ebc78e714fef7f6334c9bd3/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'pushToken',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('platform', 'text', {
            notNull: true,
            default: lit('web'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('token', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'pushToken',
        constraint: 'pushToken_token_key',
        columns: ['token'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'pushToken',
        index: 'pushToken_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'pushToken',
        foreignKey: {
          name: 'pushToken_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
