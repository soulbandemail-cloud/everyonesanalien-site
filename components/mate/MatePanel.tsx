'use client';
import { useState } from 'react';

const buttonClass = 'pink-border-glow pink-text-glow border border-white p-2 hover:bg-[#6ee7b7] hover:border-[#6ee7b7] hover:text-[#00082d] transition-all duration-200 disabled:opacity-50';
const inputClass = 'pink-border-glow border border-white bg-[#00082d] p-2';

export default function MatePanel({ enabled }: { enabled: boolean }) {
  const [mode, setMode] = useState<'signup' | 'login' | null>(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get('password');
    setBusy(true); setMessage('');
    try {
      const response = await fetch(mode === 'signup' ? '/api/subscribe' : '/api/mate/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...(mode === 'login' ? { password } : {}) }),
        signal: AbortSignal.timeout(30000),
      });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error ?? 'Unable to continue. Please try again.'); return; }
      if (mode === 'login') {
        if (data.authenticated === true) window.dispatchEvent(new Event('focus'));
        else setMessage('Unable to log in. Please try again.');
      } else {
        setMessage(data.entry === 'email' ? 'Check your email to RESET PASSWORD and finish setting up your Mate access. Open it in this browser.'
          : data.entry === 'retry' ? 'Your signup is saved, but we could not send your RESET PASSWORD email. Use LOG IN → RESET PASSWORD to try again.'
          : data.entry === 'pending' ? 'Your subscription needs confirmation or reactivation before Mate access. Check your email, then use LOG IN → RESET PASSWORD. If no confirmation arrives, contact SOUL.'
          : data.alreadySubscribed ? 'You’re already a Mate, mate.' : 'WELCOME ABOARD. You are now a Mate of the Band!');
      }
    } catch { setMessage('Unable to connect. Please try again.'); }
    finally { setBusy(false); }
  }
  async function reset(event: React.MouseEvent<HTMLButtonElement>) {
    const input = event.currentTarget.form?.elements.namedItem('email') as HTMLInputElement | null;
    if (!input?.reportValidity()) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/mate/recovery', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }), signal: AbortSignal.timeout(30000),
      });
      const data = await response.json();
      setMessage(data.message ?? data.error ?? 'Unable to request password reset. Please try again.');
    } catch { setMessage('Unable to connect. Please try again.'); }
    finally { setBusy(false); }
  }
  return <section data-dome-slot="mate" className="md:col-start-2 md:max-w-sm md:mx-auto">
    <h2 className="text-2xl mb-4">MATES</h2>
    <p className="mb-4">Get The Hyper-Fix, MATES RATE discounts on merch and tickets!</p>
    <div className="flex flex-col gap-3 max-w-md md:mx-auto">
      <div className="grid grid-cols-2 gap-3">
        {(['signup', 'login'] as const).map(value => <button key={value} type="button" aria-pressed={mode === value} disabled={busy || (value === 'login' && !enabled)} className={`${buttonClass} ${mode === value ? 'bg-[#6ee7b7] border-[#6ee7b7] text-[#00082d]' : ''}`} onClick={() => { setMode(value); setMessage(''); }}>{value === 'signup' ? 'SIGN UP' : 'LOG IN'}</button>)}
      </div>
      {mode && <form className="flex flex-col gap-3" onSubmit={submit}>
        <input name="email" aria-label="EMAIL" type="email" placeholder="EMAIL" autoComplete="email" maxLength={254} value={email} onChange={event => setEmail(event.target.value)} className={inputClass} required />
        {mode === 'login' && <input name="password" aria-label="PASSWORD" type="password" placeholder="PASSWORD" autoComplete="current-password" maxLength={1024} className={inputClass} required />}
        <button className={buttonClass} disabled={busy}>{busy ? '...' : 'ENTER'}</button>
        {mode === 'login' && <button type="button" className="mate-login-link" disabled={busy} onClick={reset}>RESET PASSWORD</button>}
      </form>}
    </div>
    {message && <div role="status" className="pink-border-glow mt-4 border border-white p-3">{message}</div>}
  </section>;
}
