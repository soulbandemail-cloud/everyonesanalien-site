import 'server-only';
import { mateConfig } from './config';
import { recoveryClient } from './server';
import { authoriseMate } from './admin';
import { eligibleSubscriber, findSubscriber } from './mailerlite';

type RecoveryStage = 'configuration' | 'membership' | 'provisioning' | 'recovery-client' | 'supabase-recovery';
class RecoveryFailure extends Error {
  constructor(readonly stage: RecoveryStage, cause: unknown) {
    super('Mate recovery failed', { cause });
  }
}

/** Server logs only: deliberately omit messages, email, URL, headers and tokens. */
export function recoveryFailureDetails(error: unknown) {
  const details: { stage: RecoveryStage | 'unknown'; status?: number; code?: string } = {
    stage: error instanceof RecoveryFailure ? error.stage : 'unknown',
  };
  let cause: unknown = error;
  for (let depth = 0; depth < 4 && cause && typeof cause === 'object'; depth++) {
    const value = cause as { status?: unknown; code?: unknown; cause?: unknown };
    if (typeof value.status === 'number' && Number.isInteger(value.status) && value.status >= 100 && value.status <= 599) details.status = value.status;
    if (typeof value.code === 'string' && /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(value.code)) details.code = value.code;
    cause = value.cause;
  }
  return details;
}

export async function requestMateRecovery(email: string): Promise<boolean> {
  let stage: RecoveryStage = 'configuration';
  try {
    const config = mateConfig();
    if (!config.enabled || !config.provisioningReady) throw new Error('Mate setup unavailable');
    stage = 'membership';
    if (!eligibleSubscriber(await findSubscriber(email), email)) return false;
    stage = 'provisioning';
    await authoriseMate(email);
    stage = 'recovery-client';
    const client = await recoveryClient();
    stage = 'supabase-recovery';
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${config.origin}/auth/reset-password`,
    });
    if (error) throw error;
    return true;
  } catch (error) { throw new RecoveryFailure(stage, error); }
}
