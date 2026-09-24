import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import MateExperience from '@/components/mate/MateExperience';
export const metadata:Metadata={title:'SOUL — Cockpit development preview',robots:{index:false,follow:false}};
export default async function ShipPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  // No public view-toggle or auth bypass: ordinary visitors always enter through /.
  if(process.env.NODE_ENV!=='development') redirect('/');
  const params=await searchParams;
  return <MateExperience preview={params.view!=='first'} entry={params.motion==='1'} development mobilePreview={params.mobile==='1'} />;
}
