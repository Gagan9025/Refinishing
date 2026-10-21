import type { Metadata } from 'next';
import { HistoryPage, type SearchParams } from '@/components/ProductionPages';

export const metadata: Metadata = { title: 'Scanning History' };

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return <HistoryPage module="scanning" searchParams={searchParams} />;
}
