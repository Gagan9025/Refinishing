import 'server-only';
import { asc } from 'drizzle-orm';
import { getDb } from '@/db';
import { users } from '@/db/schema';

export async function listUsers() {
  return getDb()
    .select({ username: users.username, name: users.name, role: users.role, status: users.status })
    .from(users)
    .orderBy(asc(users.createdAt));
}
