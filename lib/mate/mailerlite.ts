import 'server-only';

export const MATE_GROUP_ID = '189432463968175126';
export type Subscriber = { email: string; status: string; groups: { id: string }[] };
export function normaliseEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
export function eligibleSubscriber(subscriber: Subscriber | null, email: string) {
  return Boolean(subscriber && normaliseEmail(subscriber.email) === email && subscriber.status === 'active' && subscriber.groups?.some(group => String(group.id) === MATE_GROUP_ID));
}
async function mailerlite(path: string, body?: object) {
  const token = process.env.MAILERLITE_API_TOKEN;
  if (!token) throw new Error('MailerLite unavailable');
  return fetch(`https://connect.mailerlite.com/api/subscribers${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store', signal: AbortSignal.timeout(10000),
  });
}
export async function findSubscriber(email: string): Promise<Subscriber | null> {
  const response = await mailerlite(`/${encodeURIComponent(email)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('MailerLite lookup failed', { cause: { status: response.status } });
  return (await response.json()).data;
}
export async function subscribeMate(email: string, name?: string) {
  const response = await mailerlite('', { email, ...(name ? { fields: { name } } : {}), groups: [MATE_GROUP_ID] });
  if (!response.ok) throw new Error('MailerLite signup failed');
  return { subscriber: (await response.json()).data as Subscriber, alreadySubscribed: response.status === 200 };
}
