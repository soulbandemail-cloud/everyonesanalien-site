import { mateConfig, sameOrigin } from '@/lib/mate/config';
import { privateJson } from '@/lib/mate/server';
import { normaliseEmail, subscribeMate, eligibleSubscriber } from '@/lib/mate/mailerlite';
import { requestMateRecovery, recoveryFailureDetails } from '@/lib/mate/recovery';

export async function POST(request: Request) {
  const config = mateConfig();
  // Newsletter-only deployments may not yet have a Mate origin configured.
  if (!(config.validOrigin ? sameOrigin(request) : request.headers.get('origin') === new URL(request.url).origin)) return privateJson({ error: 'Invalid origin.' }, 403);
  const body = await request.json().catch(() => null);
  const email = normaliseEmail(body?.email);
  if (!email) return privateJson({ error: 'Enter a valid email address.' }, 400);
  if (!process.env.MAILERLITE_API_TOKEN) return privateJson({ error: 'Newsletter signup is temporarily unavailable. Please try again later.', code: 'SIGNUP_UNAVAILABLE' }, 503);
  try {
    const result = await subscribeMate(email, typeof body.name === 'string' ? body.name.trim().slice(0, 200) : undefined);
    if (!eligibleSubscriber(result.subscriber, email)) return privateJson({ success: true, alreadySubscribed: result.alreadySubscribed, entry: 'pending' });
    if (!config.enabled) return privateJson({ success: true, alreadySubscribed: result.alreadySubscribed });
    let entry = 'retry';
    try { entry = await requestMateRecovery(email) ? 'email' : 'pending'; }
    catch (error) { console.error('Mate signup saved; password setup email request failed', JSON.stringify(recoveryFailureDetails(error))); }
    return privateJson({ success: true, alreadySubscribed: result.alreadySubscribed, entry });
  } catch {
    return privateJson({ error: 'Signup is temporarily unavailable. Please try again later.' }, 503);
  }
}
