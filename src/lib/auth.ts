import 'server-only';
import { eq } from 'drizzle-orm';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { ROLE_HOME, type Role } from './constants';

const COOKIE = 'session';
const MAX_AGE = 60 * 60 * 12;

export type SessionUser = { username: string; name: string; role: Role };

export class AuthError extends Error {}

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error('JWT_SECRET must be set to a string of at least 32 characters.');
  return new TextEncoder().encode(s);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

/** Current user, re-checked against the DB so disabled accounts and role changes apply immediately. */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const [u] = await getDb().select().from(users).where(eq(users.username, String(payload.username))).limit(1);
    if (!u || u.status !== 'active') return null;
    return { username: u.username, name: u.name, role: u.role };
  } catch {
    return null;
  }
});

function allowed(user: SessionUser, roles: Role[]) {
  return user.role === 'admin' || roles.length === 0 || roles.includes(user.role);
}

/** For pages: redirect to login, or to the user's own dashboard when the role doesn't match. */
export async function requirePage(...roles: Role[]): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect('/login');
  if (!allowed(user, roles)) redirect(ROLE_HOME[user.role]);
  return user;
}

/** For server actions and route handlers: throws AuthError. */
export async function requireAction(...roles: Role[]): Promise<SessionUser> {
  const user = await getSession();
  if (!user) throw new AuthError('Session expired. Please log in again.');
  if (!allowed(user, roles)) throw new AuthError('You are not authorized to perform this action.');
  return user;
}
