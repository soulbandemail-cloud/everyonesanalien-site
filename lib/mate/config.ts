/** Server-only flags. Public entry requires an explicit, separately reviewed switch. */
export function mateConfig(env = process.env) {
  const origin = env.MATE_APP_ORIGIN ?? '';
  let validOrigin = false;
  try {
    const url = new URL(origin);
    validOrigin = url.origin === origin && (url.protocol === 'https:' || (env.NODE_ENV !== 'production' && url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)));
  } catch {}
  const configured = Boolean(env.SUPABASE_URL && env.SUPABASE_PUBLISHABLE_KEY && validOrigin);
  const enabled = configured && env.MATE_AUTH_ENABLED === 'true' && (env.NODE_ENV !== 'production' || env.MATE_PUBLIC_LOGIN_ENABLED === 'true');
  return { enabled, origin, url: env.SUPABASE_URL ?? '', key: env.SUPABASE_PUBLISHABLE_KEY ?? '' };
}
export function isMate(user: { email_confirmed_at?: string; app_metadata?: Record<string, unknown> } | null) {
  // Admin-controlled metadata; never trust editable user_metadata or newsletter membership alone.
  return Boolean(user?.email_confirmed_at && user.app_metadata?.mate === true);
}
export function sameOrigin(request: Request) {
  return request.headers.get('origin') === mateConfig().origin;
}
