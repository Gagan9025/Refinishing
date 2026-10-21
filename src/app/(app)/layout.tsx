import type { ReactNode } from 'react';
import { Shell } from '@/components/Shell';
import { requirePage } from '@/lib/auth';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requirePage();
  return <Shell user={user}>{children}</Shell>;
}
