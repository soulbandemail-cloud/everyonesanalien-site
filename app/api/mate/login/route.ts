import { mateConfig, sameOrigin, isMate } from '@/lib/mate/config';
import { mateClient, privateJson } from '@/lib/mate/server';
import { normaliseEmail } from '@/lib/mate/mailerlite';

export async function POST(request: Request) {
  if (!mateConfig().enabled) {
    return privateJson({ error: 'Mate login is not available yet.' }, 404);
  }

  if (!sameOrigin(request)) {
    return privateJson({ error: 'Invalid origin.' }, 403);
  }

  const body = await request.json().catch(() => null);
  const email = normaliseEmail(body?.email);
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email) {
    return privateJson({ error: 'Enter a valid email address.' }, 400);
  }

  if (!password) {
    return privateJson({ error: 'Enter your password.' }, 400);
  }

  try {
    const client = await mateClient();

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !isMate(data.user)) {
      if (data.session) {
        await client.auth.signOut({ scope: 'local' });
      }

      return privateJson(
        { error: 'Email or password incorrect.' },
        401
      );
    }

    return privateJson({ authenticated: true });
  } catch {
    return privateJson(
      { error: 'Unable to log in right now. Please try again.' },
      503
    );
  }
}