import 'server-only';
import { createClient } from '@supabase/supabase-js';

export async function authoriseMate(email: string) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Mate provisioning unavailable');
  // Never share this privileged client with the cookie/session client.
  const { auth: { admin } } = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store', signal: AbortSignal.timeout(10000) }) },
  });
  async function findUser() {
    for (let page = 1; ; page++) {
      const { data, error } = await admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error('Mate account lookup failed', { cause: error });
      const user = data.users.find(user => user.email?.toLowerCase() === email);
      if (user) return user;
      if (data.users.length < 1000) return null;
    }
  }
  let user = await findUser();
  if (!user) {
    const { data, error } = await admin.createUser({ email, email_confirm: false, app_metadata: { mate: true } });
    if (!error && data.user) return;
    // A simultaneous request may have created the same user. Never reset an account.
    if (error?.code !== 'email_exists' && error?.code !== 'user_already_exists') throw new Error('Mate provisioning failed', { cause: error });
    user = await findUser();
    if (!user) throw new Error('Mate provisioning failed', { cause: error });
  }
  if (user.app_metadata.mate === true) return;
  const { error } = await admin.updateUserById(user.id, { app_metadata: { ...user.app_metadata, mate: true } });
  if (error) throw new Error('Mate authorisation failed', { cause: error });
}
