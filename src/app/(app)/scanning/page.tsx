import type { Metadata } from 'next';
import { ProductionPage, type SearchParams } from '@/components/ProductionPages';

export const metadata: Metadata = { title: 'Scanning Production' };

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return <ProductionPage module="scanning" searchParams={searchParams} />;
}
