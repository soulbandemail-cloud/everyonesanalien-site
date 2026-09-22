'use client';

import { useEffect, useRef, useState } from 'react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const recoveryRequest = useRef<Promise<void> | null>(null);
  useEffect(() => {
    // React Strict Mode replays effects. Share one request so the code is consumed once.
    if (!recoveryRequest.current) recoveryRequest.current = (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.has('error') || params.has('error_code')) throw new Error('Invalid recovery link');
        const code = params.get('code');
        const response = await fetch('/api/mate/recovery/session', {
          ...(code ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, flowId: params.get('sb_flow_id') }) } : {}),
          cache: 'no-store', signal: AbortSignal.timeout(15000),
        });
        const data = await response.json();
        if (!response.ok || data.ready !== true) throw new Error(data.error ?? 'Unable to verify this password link.');
        window.history.replaceState(window.history.state, '', '/auth/reset-password');
        setReady(true);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'This RESET PASSWORD link is invalid or has expired. Request a new one from LOG IN.');
      }
    })();
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (password !== confirm) {
      setMessage('Passwords do not match.');
      return;
    }

    setBusy(true);

    try {
      const response = await fetch('/api/mate/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password, confirmPassword: confirm }),
        signal: AbortSignal.timeout(15000),
      });

      const data = await response.json();

      if (!response.ok || data.success !== true) {
        setMessage(data.error ?? 'Unable to reset password.');
        return;
      }

      window.location.href = '/?mate_entry=1';
    } catch {
      setMessage('Unable to connect. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#00082d] text-white flex items-center justify-center p-6">
      <section className="w-full max-w-sm">
        <h1 className="text-2xl mb-4">MATES</h1>

        <p className="mb-4">RESET PASSWORD</p>

        {ready && (
          <form className="flex flex-col gap-3" onSubmit={submit}>
            <input
              type="password"
              aria-label="PASSWORD"
              placeholder="PASSWORD"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              maxLength={1024}
              className="pink-border-glow border border-white bg-[#00082d] p-2"
            />

            <input
              type="password"
              aria-label="CONFIRM PASSWORD"
              placeholder="CONFIRM PASSWORD"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              required
              minLength={8}
              maxLength={1024}
              className="pink-border-glow border border-white bg-[#00082d] p-2"
            />

            <button
              disabled={busy}
              className="pink-border-glow pink-text-glow border border-white p-2 hover:bg-[#6ee7b7] hover:border-[#6ee7b7] hover:text-[#00082d] transition-all duration-200 disabled:opacity-50"
            >
              {busy ? '...' : 'ENTER'}
            </button>
          </form>
        )}

        {!ready && !message && (
          <p>VERIFYING...</p>
        )}

        {message && (
          <p role="status" className="mt-4">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}