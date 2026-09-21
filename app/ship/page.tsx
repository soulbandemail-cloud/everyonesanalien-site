import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import MateExperience from '@/components/mate/MateExperience';
export const metadata:Metadata={title:'SOUL — Cockpit development preview',robots:{index:false,follow:false}};
export default function ShipPage() {
  // No public view-toggle or auth bypass: ordinary visitors always enter through /.
  if(process.env.NODE_ENV!=='development') redirect('/');
  return <MateExperience preview development />;
}
