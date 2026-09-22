import { isMate, mateConfig, sameOrigin } from '@/lib/mate/config';
import { clearRecoveryCookies, mateClient, privateJson, recoveryClient } from '@/lib/mate/server';

export async function POST(request: Request) {
  if (!mateConfig().enabled) return privateJson({ error: 'Mate access is not available yet.' }, 404);
  if (!sameOrigin(request)) return privateJson({ error: 'Invalid origin.' }, 403);
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === 'string' ? body.password : '';
  if (password.length < 8 || password.length > 1024) return privateJson({ error: 'Password must be between 8 and 1024 characters.' }, 400);
  if (password !== body?.confirmPassword) return privateJson({ error: 'Passwords do not match.' }, 400);
  try {
    const recovery = await recoveryClient();
    const verified = await recovery.auth.getUser();
    if (verified.error || !isMate(verified.data.user)) return privateJson({ error: 'This password link is invalid or has expired.' }, 401);
    const { error } = await recovery.auth.updateUser({ password });
    if (error) return privateJson({ error: 'Unable to set password. Please try again.' }, 400);
    // Password saved first. Sign in with it to establish the ordinary HttpOnly session.
    // No recovery tokens are returned to JavaScript or copied into the cockpit session.
    const client = await mateClient();
    const login = await client.auth.signInWithPassword({ email: verified.data.user!.email!, password });
    if (login.error || !isMate(login.data.user)) {
      if (login.data.session) await client.auth.signOut({ scope: 'local' });
      await clearRecoveryCookies();
      return privateJson({ error: 'Password saved. Return to LOG IN and use your new password.' }, 503);
    }
    await clearRecoveryCookies();
    return privateJson({ success: true });
  } catch { return privateJson({ error: 'Unable to finish setting your password. Please retry or use LOG IN if it was saved.' }, 503); }
}
