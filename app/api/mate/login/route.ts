import { mateConfig, sameOrigin } from '@/lib/mate/config';
import { mateClient, privateJson } from '@/lib/mate/server';
export async function POST(request: Request) {
  if (!mateConfig().enabled) return privateJson({ error: 'Mate login is not available yet.' }, 404);
  if (!sameOrigin(request)) return privateJson({ error: 'Invalid origin.' }, 403);
  try {
    const { email } = await request.json();
    if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return privateJson({ error: 'Enter a valid email address.' }, 400);
    const client = await mateClient();
    const { error } = await client.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false, emailRedirectTo: `${mateConfig().origin}/auth/callback` } });
    if (error && (error.status === 429 || (error.status ?? 0) >= 500)) return privateJson({ error: 'Unable to send a link right now. Please wait and try again.' }, 503);
    // Identical response for unknown emails: no account enumeration or automatic signup.
    return privateJson({ message: 'If this email has a Mate account, a login link is on its way. Open it in this browser.' });
  } catch { return privateJson({ error: 'Unable to send a link right now. Please try again.' }, 503); }
}
