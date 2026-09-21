import { currentMate, privateJson } from '@/lib/mate/server';
export async function GET() {
  try { return privateJson({ authenticated: await currentMate() }); }
  catch { return privateJson({ error: 'Session check unavailable.' }, 503); }
}
