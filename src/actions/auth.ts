'use server';

import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { createSession, destroySession } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/constants';

export type LoginState = { error?: string };

// Compared against when the user doesn't exist, so response time doesn't reveal valid usernames.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get('username') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (!username || !password) return { error: 'Username and password are required.' };

  const [user] = await getDb().select().from(users).where(eq(users.username, username)).limit(1);
  const match = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !match) return { error: 'Invalid username or password.' };
  if (user.status === 'disabled') return { error: 'Account disabled. Please contact the system administrator.' };

  await createSession({ username: user.username, name: user.name, role: user.role });
  redirect(ROLE_HOME[user.role]);
}

export async function logout() {
  await destroySession();
  redirect('/login');
}
