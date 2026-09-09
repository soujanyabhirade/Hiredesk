import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d.ts';

const contractPath = path.join(
  process.cwd(),
  'src',
  'prisma',
  'contract.json',
);

const contractJson = JSON.parse(
  fs.readFileSync(contractPath, 'utf8'),
) as Contract;

export const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL'],
});