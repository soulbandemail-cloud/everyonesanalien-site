import { mateConfig, sameOrigin } from '@/lib/mate/config';
import { privateJson } from '@/lib/mate/server';
import { normaliseEmail } from '@/lib/mate/mailerlite';
import { requestMateEntry } from '@/lib/mate/entry';
export async function POST(request: Request) {
  if (!mateConfig().enabled) return privateJson({ error: 'Mate login is not available yet.' }, 404);
  if (!sameOrigin(request)) return privateJson({ error: 'Invalid origin.' }, 403);
  const body = await request.json().catch(() => null);
  const email = normaliseEmail(body?.email);
  if (!email) return privateJson({ error: 'Enter a valid email address.' }, 400);
  try { await requestMateEntry(email); }
  catch {
  console.error('Mate entry request failed; check server configuration and provider availability.');
}
  // Provider errors must not reveal that this particular email qualified.
  return privateJson({ message: 'If this email belongs to a Mate, you’ll receive an email with the next step. Open it in this browser.' });
}
