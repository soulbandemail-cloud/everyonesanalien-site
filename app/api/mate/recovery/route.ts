import { mateConfig, sameOrigin } from '@/lib/mate/config';
import { normaliseEmail } from '@/lib/mate/mailerlite';
import { requestMateRecovery, recoveryFailureDetails } from '@/lib/mate/recovery';
import { privateJson } from '@/lib/mate/server';

export async function POST(request: Request) {
  if (!mateConfig().enabled) return privateJson({ error: 'Mate access is not available yet.' }, 404);
  if (!sameOrigin(request)) return privateJson({ error: 'Invalid origin.' }, 403);
  const body = await request.json().catch(() => null);
  const email = normaliseEmail(body?.email);
  if (!email) return privateJson({ error: 'Enter a valid email address.' }, 400);
  try {
    const accepted = await requestMateRecovery(email);
    console.info('Mate recovery request outcome', JSON.stringify({ outcome: accepted ? 'supabase-accepted' : 'not-eligible' }));
  }
  catch (error) { console.error('Mate recovery request failed', JSON.stringify(recoveryFailureDetails(error))); }
  return privateJson({ message: 'If this email belongs to an eligible Mate, you’ll receive a RESET PASSWORD email. Open it in this browser.' });
}
