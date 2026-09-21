import { NextResponse } from 'next/server';
import { mateConfig, isMate } from '@/lib/mate/config';
import { clearMateCookies, mateClient } from '@/lib/mate/server';
export async function GET(request: Request) {
  const config = mateConfig();
  if (!config.enabled) return new Response('Mate login is not available yet.', { status: 404 });
  const destination = new URL('/', config.origin);
  try {
    const code = new URL(request.url).searchParams.get('code');
    if (!code || code.length > 4096) throw new Error('Missing code');
    const client = await mateClient();
    // PKCE binds this callback to the browser that requested the email link.
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) throw error;
    const { data } = await client.auth.getUser();
    if (!isMate(data.user)) {
      await client.auth.signOut({ scope: 'local' });
      throw new Error('Not a provisioned Mate');
    }
    destination.searchParams.set('mate_entry', '1');
  } catch {
    await clearMateCookies();
    destination.searchParams.set('mate_error', '1');
  }
  return NextResponse.redirect(destination, { headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } });
}
