import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isMate, mateConfig } from './config';

export async function mateClient() {
  const config = mateConfig();
  if (!config.enabled) throw new Error('Mate entry unavailable');
  const jar = await cookies();
  return createServerClient(config.url, config.key, {
    cookieOptions: { name: 'eaa-mate', httpOnly: true, secure: config.origin.startsWith('https:'), sameSite: 'lax', path: '/' },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: values => {
        // Server Components cannot write cookies. Proxy/route handlers persist refreshes.
        try { values.forEach(({ name, value, options }) => jar.set(name, value, options)); } catch {}
      },
    },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10000), cache: 'no-store' }) },
  });
}
export async function currentMate() {
  if (!mateConfig().enabled) return false;
  const client = await mateClient();
  const { data, error } = await client.auth.getUser();
  if (error && error.name !== 'AuthSessionMissingError' && ![400,401,403].includes(error.status ?? 0)) throw error;
  return !error && isMate(data.user);
}
export async function clearMateCookies() {
  const jar = await cookies();
  for (const { name } of jar.getAll()) if (name === 'eaa-mate' || name.startsWith('eaa-mate.') || name === 'eaa-mate-code-verifier') jar.delete(name);
}
export function privateJson(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
}
