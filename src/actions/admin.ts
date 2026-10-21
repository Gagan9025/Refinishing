'use server';

import bcrypt from 'bcryptjs';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { run, UserError, type ActionResult } from '@/lib/action';
import { requireAction } from '@/lib/auth';
import { ROLES, type Role } from '@/lib/constants';

const MIN_PASSWORD = 6;
const USERNAME_RE = /^[a-z0-9._-]{3,32}$/;

export async function createUser(input: { name: string; username: string; role: Role; password: string }): Promise<ActionResult> {
  return run(async () => {
    const admin = await requireAction();
    if (admin.role !== 'admin') throw new UserError('Only administrators can manage users.');
    const username = input.username.trim().toLowerCase();
    const name = input.name.trim();
    if (!name) throw new UserError('Full name is required.');
    if (!USERNAME_RE.test(username)) throw new UserError('Username must be 3-32 characters: letters, numbers, dot, dash or underscore.');
    if (!ROLES.includes(input.role)) throw new UserError('Invalid user role specified.');
    if (input.password.length < MIN_PASSWORD) throw new UserError(`Password must be at least ${MIN_PASSWORD} characters long.`);

    const inserted = await getDb()
      .insert(users)
      .values({ username, name, role: input.role, passwordHash: await bcrypt.hash(input.password, 10), createdBy: admin.username })
      .onConflictDoNothing()
      .returning({ username: users.username });
    if (inserted.length === 0) throw new UserError('A user with this username already exists.');
    return `User ${name} created.`;
  });
}

export async function setUserStatus(username: string, status: 'active' | 'disabled'): Promise<ActionResult> {
  return run(async () => {
    const admin = await requireAction();
    if (admin.role !== 'admin') throw new UserError('Only administrators can manage users.');
    if (status !== 'active' && status !== 'disabled') throw new UserError('Invalid status.');
    if (username === 'admin' || username === admin.username) {
      if (status === 'disabled') throw new UserError('You cannot disable the primary admin or your own account.');
    }
    const updated = await getDb().update(users).set({ status, updatedAt: sql`now()` }).where(eq(users.username, username)).returning({ u: users.username });
    if (updated.length === 0) throw new UserError('User not found.');
    return `User ${username} ${status === 'active' ? 'enabled' : 'disabled'}.`;
  });
}

export async function resetPassword(username: string, newPassword: string): Promise<ActionResult> {
  return run(async () => {
    const admin = await requireAction();
    if (admin.role !== 'admin') throw new UserError('Only administrators can manage users.');
    if (newPassword.length < MIN_PASSWORD) throw new UserError(`New password must be at least ${MIN_PASSWORD} characters long.`);
    const updated = await getDb()
      .update(users)
      .set({ passwordHash: await bcrypt.hash(newPassword, 10), updatedAt: sql`now()` })
      .where(eq(users.username, username))
      .returning({ u: users.username });
    if (updated.length === 0) throw new UserError('User not found.');
    return 'Password reset successfully.';
  });
}
