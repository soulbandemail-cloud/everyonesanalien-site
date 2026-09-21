'use client';
import { useRef, useState } from 'react';
export function MateLogin({ enabled, authenticated }: { enabled: boolean; authenticated: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');
  if (!enabled || authenticated) return null;
  return <div className="mate-login">
    <button type="button" className="mate-login-link" onClick={()=>dialog.current?.showModal()}>LOG IN</button>
    <dialog ref={dialog} className="mate-login-dialog" aria-labelledby="mate-login-title">
      <form onSubmit={async event=>{
        event.preventDefault(); setBusy(true); setMessage('');
        const email = new FormData(event.currentTarget).get('email');
        try {
          const response=await fetch('/api/mate/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email}),signal:AbortSignal.timeout(15000)});
          const data=await response.json(); setMessage(data.message ?? data.error ?? 'Please try again.');
        } catch { setMessage('Unable to connect. Please try again.'); }
        finally { setBusy(false); }
      }}>
        <h2 id="mate-login-title">WELCOME BACK, MATE.</h2>
        <p>We’ll email you a link to come aboard.</p>
        <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
        <button disabled={busy}>{busy ? 'SENDING…' : 'SEND LOGIN LINK'}</button>
        <p role="status">{message}</p>
        <button type="button" onClick={()=>dialog.current?.close()}>CLOSE</button>
      </form>
    </dialog>
  </div>;
}
