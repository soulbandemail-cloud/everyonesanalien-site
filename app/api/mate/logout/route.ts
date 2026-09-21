import { mateConfig, sameOrigin } from '@/lib/mate/config';
import { clearMateCookies, mateClient, privateJson } from '@/lib/mate/server';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return privateJson({ error: 'Invalid origin.' }, 403);
  try {
    if (mateConfig().enabled) {
      const client = await mateClient();
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) return privateJson({ error: 'Could not log out. Please try again.' }, 503);
    }
    await clearMateCookies();
    return privateJson({ authenticated: false });
  } catch { return privateJson({ error: 'Could not log out. Please try again.' }, 503); }
}
