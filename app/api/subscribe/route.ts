import { mateConfig, sameOrigin } from '@/lib/mate/config';
import { normaliseEmail, subscribeMate, eligibleSubscriber } from '@/lib/mate/mailerlite';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});

/** Newsletter subscription only. Never provision an account or send Auth emails. */
export async function POST(request: Request) {
  const config = mateConfig();
  if (!(config.validOrigin ? sameOrigin(request) : request.headers.get('origin') === new URL(request.url).origin)) return json({ error: 'Invalid origin.' }, 403);
  const body = await request.json().catch(() => null);
  const email = normaliseEmail(body?.email);
  if (!email) return json({ error: 'Enter a valid email address.' }, 400);
  if (!process.env.MAILERLITE_API_TOKEN) return json({ error: 'Subscription is temporarily unavailable. Please try again later.' }, 503);
  try {
    const result = await subscribeMate(email);
    if (!eligibleSubscriber(result.subscriber, email)) return json({success:false,pending:true,message:result.subscriber?.status==='unconfirmed'
      ? 'Your subscription still needs confirmation. Please check your email.'
      : 'Your subscription is not active yet. Please contact soul@everyonesanalien.com for help.'},202);
    return json({ success:true, alreadySubscribed:result.alreadySubscribed, message:result.alreadySubscribed ? "You're already a Mate, mate" : 'Welcome aboard!' });
  } catch {
    return json({ error: 'Subscription is temporarily unavailable. Please try again later.' }, 503);
  }
}
