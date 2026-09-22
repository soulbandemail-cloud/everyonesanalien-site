import { notFound } from 'next/navigation';
import Link from 'next/link';
import { mateConfig } from '@/lib/mate/config';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mate login setup', robots: { index: false, follow: false } };
export default function MateSetup() {
  const config = mateConfig();
  if (!config.development && !config.preview) notFound();
  const checks = [
    ['SUPABASE_URL', Boolean(config.url)],
    ['SUPABASE_PUBLISHABLE_KEY', Boolean(config.key)],
    ['MATE_APP_ORIGIN (valid exact origin)', config.validOrigin],
    ['MATE_AUTH_ENABLED=true', process.env.MATE_AUTH_ENABLED === 'true'],
    ...(!config.development ? [['MATE_PREVIEW_LOGIN_ENABLED=true', process.env.MATE_PREVIEW_LOGIN_ENABLED === 'true']] : []),
    ['SUPABASE_SERVICE_ROLE_KEY (server only)', Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)],
    ['MAILERLITE_API_TOKEN (membership and signup)', Boolean(process.env.MAILERLITE_API_TOKEN)],
  ] as [string, boolean][];
  return <main style={{maxWidth:760,margin:'40px auto',padding:24,color:'#f9edff',lineHeight:1.7}}>
    <h1 style={{fontSize:28}}>MATE LOGIN · DEVELOPMENT SETUP</h1>
    <p>{config.enabled && config.provisioningReady ? 'Login is configured. Test the real email-link flow from the homepage.' : 'Real login is not configured yet. No simulated login or account bypass is available.'}</p>
    <ul>{checks.map(([name,ready])=><li key={name}><code>{name}</code> — {ready ? 'present / ready' : 'missing / disabled'}</li>)}</ul>
    <p>No credential values are displayed here. Keep the public login flag off.</p>
    <ol>
      <li>Set the missing values in your local environment or the hosting provider’s Preview environment, then restart/rebuild.</li>
      <li>In Supabase, allow your exact app origin plus <code>/auth/callback</code> as a redirect. Use the standard magic-link email template.</li>
      <li>Use an active subscriber in MailerLite Mate group 189432463968175126. The server provisions their Supabase account automatically.</li>
      <li>On the homepage, click LOG IN, request a link for that account, and open the email link in this same browser.</li>
      <li>Check the camera reveal, the live site content on the glass, and LOG OUT returning to the public homepage.</li>
    </ol>
    <p>BECOME A MATE saves MailerLite membership, then requests an authentication email when entry is enabled. First-time users must confirm their email.</p>
    <p><Link href="/" style={{color:'#7fffd4'}}>Open the real homepage →</Link></p>
    {config.development && <p><Link href="/ship" style={{color:'#7fffd4'}}>Open geometry preview (no Mate session) →</Link></p>}
    <p>Full setup and test notes: <code>docs/mate-entry.md</code>. No settings are changed by visiting this page.</p>
  </main>;
}
