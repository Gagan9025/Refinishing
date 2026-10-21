import type { Metadata } from 'next';
import { ProductionPage, type SearchParams } from '@/components/ProductionPages';

export const metadata: Metadata = { title: 'Batch Production' };

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return <ProductionPage module="batch" searchParams={searchParams} />;
}
