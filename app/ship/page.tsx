import type { Metadata } from 'next';
import Ship from '@/components/ship/Ship';
export const metadata: Metadata = { title: 'SOUL — Ship / Build 0', robots: { index: false, follow: false } };
export default function ShipPage() { return <Ship />; }
