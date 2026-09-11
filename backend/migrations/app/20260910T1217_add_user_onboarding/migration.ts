#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/5aa16b32596a33067858574a7975afb734b47c02307ad9a50f8eb08207dbdb66/contract';
import startContract from '../../snapshots/5aa16b32596a33067858574a7975afb734b47c02307ad9a50f8eb08207dbdb66/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/8c4a1bc58ef1df6e96a238d0f684e7a06792603e1f6993a75d205e56c6ec5fe5/contract';
import endContract from '../../snapshots/8c4a1bc58ef1df6e96a238d0f684e7a06792603e1f6993a75d205e56c6ec5fe5/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('activationExpiresAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('activationTokenHash', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('name', 'text', {
          notNull: true,
          default: lit(''),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('status', 'text', {
          notNull: true,
          default: lit('ACTIVE'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
