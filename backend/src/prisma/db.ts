import 'dotenv/config';
import fs from 'node:fs';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d.ts';

const contractJson = JSON.parse(
  fs.readFileSync(
    new URL('./contract.json', import.meta.url),
    'utf8',
  ),
) as Contract;

export const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL'],
});