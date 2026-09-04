#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/5aa16b32596a33067858574a7975afb734b47c02307ad9a50f8eb08207dbdb66/contract';
import endContract from '../../snapshots/5aa16b32596a33067858574a7975afb734b47c02307ad9a50f8eb08207dbdb66/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/bef7a80982eaca7d23e9443875f4385bedcf6547e2efe1c50772f86f473ffd0f/contract';
import startContract from '../../snapshots/bef7a80982eaca7d23e9443875f4385bedcf6547e2efe1c50772f86f473ffd0f/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('role', 'text', {
          notNull: true,
          default: lit('MENTOR'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
