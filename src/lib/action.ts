import 'server-only';
import { revalidatePath } from 'next/cache';
import { AuthError } from './auth';

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

/** Thrown for validation problems whose message is safe to show to the user. */
export class UserError extends Error {}

/** Runs a mutation, turns expected errors into a result, hides unexpected ones, and refreshes all pages. */
export async function run(fn: () => Promise<string>): Promise<ActionResult> {
  try {
    const message = await fn();
    revalidatePath('/', 'layout');
    return { ok: true, message };
  } catch (err) {
    if (err instanceof UserError || err instanceof AuthError) return { ok: false, error: err.message };
    console.error('Action failed:', err);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }
}
