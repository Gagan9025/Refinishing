import type { Metadata } from 'next';
import { AdminUsers } from '@/components/AdminUsers';
import { requirePage } from '@/lib/auth';
import { listUsers } from '@/lib/data/users';

export const metadata: Metadata = { title: 'System Admin' };

export default async function Page() {
  const user = await requirePage('admin');
  return <AdminUsers users={await listUsers()} self={user.username} />;
}
