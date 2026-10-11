'use client';
import { useState } from 'react';
const buttonClass='pink-border-glow pink-text-glow border border-white bg-[#00082d] p-2 hover:bg-[#6ee7b7] hover:border-[#6ee7b7] hover:text-[#00082d] transition-all duration-200 disabled:opacity-50';
export default function MatePanel(){
 const [email,setEmail]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;setBusy(true);setMessage('');
  try {
   const response=await fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email}),signal:AbortSignal.timeout(30000)});
   const data=await response.json();
   if(!response.ok){setMessage(data.error??'Unable to subscribe. Please try again.');return;}
   setMessage(data.success===true ? (data.alreadySubscribed ? "You're already a Mate, mate" : 'Welcome aboard!') : data.message??'Your subscription is not confirmed yet. Please try again later.');
  }catch{setMessage('Unable to connect. Please try again.');}finally{setBusy(false);}
 }
 return <section data-dome-slot="mate">
  <h2 className="text-2xl mb-4">THE MATES</h2>
  <p className="mb-4">Get The Hyper-Fix (the official SOUL newsletter) for MATES RATE discounts on merch and tickets!</p>
  <form className="flex flex-col gap-3" onSubmit={submit}>
   <input name="email" aria-label="EMAIL" type="email" placeholder="EMAIL" autoComplete="email" maxLength={254} value={email} onChange={event=>setEmail(event.target.value)} className="pink-border-glow border border-white bg-[#00082d] p-2" required />
   <button type="submit" className={buttonClass} disabled={busy}>{busy?'...':'ENTER'}</button>
  </form>
  {message&&<p role="status" className="mt-3">{message}</p>}
 </section>;
}
