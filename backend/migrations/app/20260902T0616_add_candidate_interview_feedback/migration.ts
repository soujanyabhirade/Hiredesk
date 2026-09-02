#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/6f26964ecf08a958d85861c9c64d1b9ec061b8fea8db7b43d2e6d7f914c64307/contract';
import startContract from '../../snapshots/6f26964ecf08a958d85861c9c64d1b9ec061b8fea8db7b43d2e6d7f914c64307/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/917dddc94c17e62387a574ab5b76d68d35ae27cf3706f11c0afac4782156323f/contract';
import endContract from '../../snapshots/917dddc94c17e62387a574ab5b76d68d35ae27cf3706f11c0afac4782156323f/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'candidate',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('jobId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('phone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'feedback',
        columns: [
          col('comments', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('interviewId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('rating', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'interview',
        columns: [
          col('candidateId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('scheduledAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('status', 'text', {
            notNull: true,
            default: lit('SCHEDULED'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'candidate',
        constraint: 'candidate_email_key',
        columns: ['email'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'candidate',
        index: 'candidate_jobId_idx_623c8f77',
        columns: ['jobId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'feedback',
        index: 'feedback_interviewId_idx_766b64f2',
        columns: ['interviewId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'interview',
        index: 'interview_candidateId_idx_462b5869',
        columns: ['candidateId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'candidate',
        foreignKey: {
          name: 'candidate_jobId_fkey',
          columns: ['jobId'],
          references: { schema: 'public', table: 'job', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'feedback',
        foreignKey: {
          name: 'feedback_interviewId_fkey',
          columns: ['interviewId'],
          references: { schema: 'public', table: 'interview', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'interview',
        foreignKey: {
          name: 'interview_candidateId_fkey',
          columns: ['candidateId'],
          references: { schema: 'public', table: 'candidate', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
