/** Server-only flags. Preview testing and public launch are separate decisions. */
export function mateConfig(env = process.env) {
  const origin = env.MATE_APP_ORIGIN ?? '';
  let validOrigin = false;
  let publicSite = false;
  try {
    const url = new URL(origin);
    publicSite = ['everyonesanalien.com', 'www.everyonesanalien.com'].includes(url.hostname);
    validOrigin = url.origin === origin && (url.protocol === 'https:' || (env.NODE_ENV !== 'production' && url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)));
  } catch {}
  const configured = Boolean(env.SUPABASE_URL && env.SUPABASE_PUBLISHABLE_KEY && validOrigin);
  const development = env.NODE_ENV === 'development';
  // Vercel sets this server environment value; browser input cannot select it.
  const preview = env.VERCEL_ENV === 'preview' && !publicSite;
  const previewEnabled = preview && env.MATE_PREVIEW_LOGIN_ENABLED === 'true';
  const publicEnabled = env.MATE_PUBLIC_LOGIN_ENABLED === 'true';
  const enabled = configured && env.MATE_AUTH_ENABLED === 'true' && (development || previewEnabled || publicEnabled);
  const provisioningReady = Boolean(env.MAILERLITE_API_TOKEN && env.SUPABASE_SERVICE_ROLE_KEY);
  return { provisioningReady, enabled, configured, validOrigin, development, preview, origin, url: env.SUPABASE_URL ?? '', key: env.SUPABASE_PUBLISHABLE_KEY ?? '' };
}
export function isMate(user: { email_confirmed_at?: string; app_metadata?: Record<string, unknown> } | null) {
  // Admin-controlled metadata; never trust editable user_metadata or newsletter membership alone.
  return Boolean(user?.email_confirmed_at && user.app_metadata?.mate === true);
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const config = mateConfig();

  if (!origin) return false;

  if (origin === config.origin) return true;

  if (process.env.NODE_ENV === 'production') {
    return (
      origin === 'https://everyonesanalien.com' ||
      origin === 'https://www.everyonesanalien.com'
    );
  }

  return false;
}
