/**
 * Idempotent seed: creates the demo accounts and the 50-person attendance roster if they don't exist.
 * Run with `npm run db:seed`. For a real deployment use `SEED_RANDOM_PASSWORDS=1`: each new account gets a
 * random password that is printed once. Otherwise the well-known demo passwords are used.
 */
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { getDb } from './index';
import { employees, users } from './schema';
import type { Role } from '@/lib/constants';

const DEMO_USERS: { username: string; password: string; name: string; role: Role }[] = [
  { username: 'scan.supervisor', password: 'Scan@123', name: 'Scanning Supervisor', role: 'scanning_supervisor' },
  { username: 'batch.supervisor', password: 'Batch@123', name: 'Batch Supervisor', role: 'batch_supervisor' },
  { username: 'dispatch.supervisor', password: 'Dispatch@123', name: 'Dispatch Supervisor', role: 'dispatch_supervisor' },
  { username: 'hod', password: 'HOD@123', name: 'Department HOD', role: 'hod' },
  { username: 'admin', password: 'Admin@123', name: 'System Admin', role: 'admin' },
];

const EMPLOYEE_NAMES = [
  'Alex Johnson', 'Beatriz Silva', 'Carlos Mendez', 'David Kim', 'Elena Rostova',
  'Farhan Akhtar', 'Grace Chen', 'Hassan Ali', 'Irene Adler', 'Jamal Crawford',
  'Kevin Patel', 'Laura Palmer', 'Marcus Vance', 'Nina Dobrev', 'Omar Farooq',
  'Pradeep Sharma', 'Qasim Khan', 'Rachel Green', 'Siddharth Rao', 'Tariq Mahmood',
  'Umar Farooq', 'Victor Hugo', 'Winston Smith', 'Xavier Dupont', 'Yousuf Raza',
  'Zainab Malik', 'Aaron Paul', 'Bryan Cranston', 'Claire Danes', 'Daniel Craig',
  'Emily Blunt', 'Frank Castle', 'George Clooney', 'Hannah Abbott', 'Ian McKellen',
  'John Wick', 'Kate Winslet', 'Liam Neeson', 'Morgan Freeman', 'Naomi Watts',
  'Oliver Stone', 'Peter Parker', 'Quentin Tarantino', 'Robert DeNiro', 'Steve Rogers',
  'Tom Hardy', 'Uma Thurman', 'Vin Diesel', 'Will Smith', 'Zendaya Coleman',
];

async function main() {
  const db = getDb();
  const random = process.env.SEED_RANDOM_PASSWORDS === '1';

  for (const u of DEMO_USERS) {
    if (random) u.password = randomBytes(12).toString('base64url');
    const rows = await db
      .insert(users)
      .values({ username: u.username, name: u.name, role: u.role, passwordHash: await bcrypt.hash(u.password, 10) })
      .onConflictDoNothing()
      .returning({ username: users.username });
    if (rows.length) console.log(`Created user ${u.username}${random ? `  password: ${u.password}` : ""}`);
  }

  const added = await db
    .insert(employees)
    .values(EMPLOYEE_NAMES.map((name, i) => ({ id: `EMP${String(i + 1).padStart(3, '0')}`, name })))
    .onConflictDoNothing()
    .returning({ id: employees.id });
  console.log(`Roster: ${added.length} employee(s) added.`);

  console.log('Seed complete. Change passwords from the Admin screen if they were not randomised.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
