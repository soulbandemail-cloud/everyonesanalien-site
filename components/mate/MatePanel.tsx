'use client';
import { useRef, useState } from 'react';
import GlassText from '@/components/home/GlassText';
import MobileEmailOverlay from './MobileEmailOverlay';
const buttonClass='pink-border-glow pink-text-glow border border-white bg-[#00082d] p-2 hover:bg-[#6ee7b7] hover:border-[#6ee7b7] hover:text-[#00082d] transition-all duration-200 disabled:opacity-50';
export default function MatePanel({mobile=false}:{mobile?:boolean}){
 const [open,setOpen]=useState(false);
 const pending=useRef(false);
 const [email,setEmail]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(pending.current)return;pending.current=true;setBusy(true);setMessage('');
  if(mobile)event.currentTarget.querySelector('input')?.blur();
  try {
   const response=await fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email}),signal:AbortSignal.timeout(30000)});
   const data=await response.json();
   if(!response.ok){setMessage(data.error??'Unable to subscribe. Please try again.');return;}
   setMessage(data.success===true ? (data.alreadySubscribed ? "You're already a Mate, mate" : 'Welcome aboard!') : data.message??'Your subscription is not confirmed yet. Please try again later.');
  }catch{setMessage('Unable to connect. Please try again.');}finally{pending.current=false;setBusy(false);}
 }
 const form=<><form className="flex flex-col gap-3" onSubmit={submit}>
   <input name="email" aria-label="EMAIL" type="email" placeholder="EMAIL" autoComplete="email" enterKeyHint={mobile?"go":undefined} maxLength={254} value={email} onChange={event=>setEmail(event.target.value)} className="pink-border-glow border border-white bg-[#00082d] p-2" required />
   <button type="submit" className={buttonClass} disabled={busy}><span role="status" aria-live="polite">{busy?'...':message||'ENTER'}</span></button>
  </form>
 </>;
 return <section data-dome-slot="mate">
  <h2 className="text-2xl mb-4">MATES</h2>
  <p className="mb-4"><GlassText>Sign up to SOUL's mating list for MATES RATE discounts!</GlassText></p>
  {mobile ? <><button type="button" className="mobile-email-entry pink-border-glow border border-white bg-[#00082d] p-2" aria-haspopup="dialog" onClick={()=>setOpen(true)}>EMAIL</button>
   {open&&<MobileEmailOverlay onClose={()=>setOpen(false)}>{form}</MobileEmailOverlay>}
  </> : form}
 </section>;
}
