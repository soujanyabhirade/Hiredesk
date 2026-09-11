import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { db } from '../src/prisma/db.js';

const email = process.env['ADMIN_EMAIL'];
const password = process.env['ADMIN_PASSWORD'];
const name = process.env['ADMIN_NAME'] ?? 'HireDesk Admin';

if (!email || !password) {
  throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
}

const existingUser = await db.orm.public.User.first({ email });

if (existingUser) {
  await db.orm.public.User.where({ id: existingUser.id }).update({
    name: existingUser.name || name,
    role: 'ADMIN',
    status: 'ACTIVE',
  });
  console.log(`Admin account confirmed for ${email}`);
} else {
  await db.orm.public.User.create({
    name,
    email,
    password: await bcrypt.hash(password, 10),
    role: 'ADMIN',
    status: 'ACTIVE',
  });
  console.log(`Admin account created for ${email}`);
}
