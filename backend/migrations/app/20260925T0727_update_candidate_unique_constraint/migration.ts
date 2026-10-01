#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/8c4a1bc58ef1df6e96a238d0f684e7a06792603e1f6993a75d205e56c6ec5fe5/contract';
import startContract from '../../snapshots/8c4a1bc58ef1df6e96a238d0f684e7a06792603e1f6993a75d205e56c6ec5fe5/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/e689286962601a1be3305f9be270a2d82f86039f6ebc78e714fef7f6334c9bd3/contract';
import endContract from '../../snapshots/e689286962601a1be3305f9be270a2d82f86039f6ebc78e714fef7f6334c9bd3/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropConstraint({
        schema: 'public',
        table: 'candidate',
        constraint: 'candidate_email_key',
      }),
      this.addUnique({
        schema: 'public',
        table: 'candidate',
        constraint: 'candidate_email_jobId_key',
        columns: ['email', 'jobId'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
