import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isMate, mateConfig } from './config';

export function mateClient() { return cookieClient('eaa-mate'); }

// A recovery link proves email ownership, but must not activate the cockpit.
export function recoveryClient() { return cookieClient('eaa-mate-recovery', 3600); }

async function cookieClient(name: string, maxAge?: number) {
  const config = mateConfig();
  if (!config.enabled) throw new Error('Mate entry unavailable');
  const jar = await cookies();
  return createServerClient(config.url, config.key, {
    cookieOptions: { name, ...(maxAge ? { maxAge } : {}), httpOnly: true, secure: config.origin.startsWith('https:'), sameSite: 'lax', path: '/' },
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
async function clearCookies(prefix: string) {
  const jar = await cookies();
  for (const { name } of jar.getAll()) {
    if (name === prefix || name.startsWith(`${prefix}.`) || name === `${prefix}-code-verifier` || name === `${prefix}-flows-code-verifier` || name.startsWith(`${prefix}-flow-`)) jar.delete(name);
  }
}
export async function clearRecoveryCookies() { await clearCookies('eaa-mate-recovery'); }
export async function clearMateCookies() {
  await clearCookies('eaa-mate');
  await clearRecoveryCookies();
}
export function privateJson(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
}
