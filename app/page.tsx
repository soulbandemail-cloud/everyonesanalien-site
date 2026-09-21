import MateExperience from '@/components/mate/MateExperience';
import { mateConfig } from '@/lib/mate/config';
import { currentMate } from '@/lib/mate/server';
export default async function Home({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const params=await searchParams;
  let authenticated=false;
  try { authenticated=await currentMate(); } catch { /* Homepage remains usable if auth is unavailable. */ }
  return <MateExperience initialAuthenticated={authenticated} loginEnabled={mateConfig().enabled} entry={authenticated && params.mate_entry==='1'} error={params.mate_error==='1'} development={process.env.NODE_ENV==='development'} />;
}
