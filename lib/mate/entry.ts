import 'server-only';
import { mateConfig } from './config';
import { mateClient } from './server';
import { authoriseMate } from './admin';
import { eligibleSubscriber, findSubscriber } from './mailerlite';

export async function requestMateEntry(email: string): Promise<boolean> {
  const config = mateConfig();
  if (!config.enabled || !config.provisioningReady) throw new Error('Mate entry unavailable');
  // Always read membership here, even after signup. Login never writes to MailerLite.
  if (!eligibleSubscriber(await findSubscriber(email), email)) return false;
  await authoriseMate(email);
  const client = await mateClient();
  const { error } = await client.auth.signInWithOtp({ email, options: {
    shouldCreateUser: false, emailRedirectTo: `${config.origin}/auth/callback`,
  } });
  if (error) throw new Error('Mate email request failed');
  return true;
}
