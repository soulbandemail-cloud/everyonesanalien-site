import { isMate, mateConfig, sameOrigin } from '@/lib/mate/config';
import { clearRecoveryCookies, privateJson, recoveryClient } from '@/lib/mate/server';

const invalid = () => privateJson({ error: 'This RESET PASSWORD link is invalid or has expired. Request a new one from LOG IN.' }, 401);

// Reloading the reset form may resume only the isolated recovery session.
export async function GET() {
  if (!mateConfig().enabled) return privateJson({ error: 'Mate access is not available yet.' }, 404);
  try {
    const client = await recoveryClient();
    const { data, error } = await client.auth.getUser();
    return !error && isMate(data.user) ? privateJson({ ready: true }) : invalid();
  } catch { return privateJson({ error: 'Unable to check your recovery session. Please retry.' }, 503); }
}

export async function POST(request: Request) {
  if (!mateConfig().enabled) return privateJson({ error: 'Mate access is not available yet.' }, 404);
  if (!sameOrigin(request)) return privateJson({ error: 'Invalid origin.' }, 403);
  const body = await request.json().catch(() => null);
  if (typeof body?.code !== 'string' || !body.code || body.code.length > 4096) return invalid();
  const flowId = typeof body.flowId === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(body.flowId) ? body.flowId : undefined;
  try {
    const client = await recoveryClient();
    // This is the only exchange. No browser SDK auto-detection or cockpit cookies.
    const { data, error } = await client.auth.exchangeCodeForSession(body.code, { flowId });
    if (error || !('redirectType' in data) || data.redirectType !== 'recovery') {
      await clearRecoveryCookies();
      return invalid();
    }
    const verified = await client.auth.getUser();
    if (verified.error || !isMate(verified.data.user)) {
      await clearRecoveryCookies();
      return invalid();
    }
    return privateJson({ ready: true });
  } catch {
    await clearRecoveryCookies();
    return invalid();
  }
}
