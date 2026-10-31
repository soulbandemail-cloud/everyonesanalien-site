'use client';
import {useEffect,useId,useRef} from 'react';

/** Isolated compositor animation. It never writes a cockpit camera or asset. */
export default function UfoArrival({ready,enabled,portrait,onReveal,onFinished}:{ready:boolean;enabled:boolean;portrait:boolean;onReveal:()=>void;onFinished:()=>void}){
 const node=useRef<HTMLDivElement>(null),id=useId().replaceAll(':','');
 useEffect(()=>{
  if(!enabled){onReveal();onFinished();return;}
  let seen=false;try{seen=sessionStorage.getItem('soul-arrival-v2')==='1';}catch{}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const replay=process.env.NODE_ENV==='development'&&new URLSearchParams(location.search).has('arrival-test');
  if((seen&&!replay)||reduced.matches){onReveal();onFinished();return;}
  if(!ready)return;
  try{sessionStorage.setItem('soul-arrival-v2','1');}catch{}
  const element=node.current;if(!element){onReveal();onFinished();return;}
  // Readiness is settled before starting: no heavy interior mount during flight.
  const turn=portrait?90:0;
  // Begin at roughly two CSS pixels, independent of desktop/mobile width.
  const distantScale=2/Math.max(1,element.clientWidth);
  const animation=element.animate([
   {offset:0,easing:'ease-in',transform:`translateY(-10vh) rotate(${turn}deg) scale(${distantScale})`},
   {offset:.45,easing:'ease-in',transform:`translateY(-7vh) rotate(${turn*.6}deg) scale(.08)`},
   {offset:.75,transform:'translateY(0) rotate(0deg) scale(1.1)'},
   {offset:.9,transform:'translateY(50vh) rotate(0deg) scale(12)'},
   {offset:1,transform:'translateY(160vh) rotate(0deg) scale(40)'},
  ],{duration:1000,easing:'linear',fill:'forwards'});
  // Only the glass clears during entry (800–900ms), before the existing reveal.
  // The hull retains its original motion, appearance and opacity throughout.
  const glass=element.querySelector('[data-arrival-glass]')?.animate([
   {offset:0,opacity:1},{offset:.8,opacity:1,easing:'ease-in-out'},
   {offset:.9,opacity:0},{offset:1,opacity:0},
  ],{duration:1000,easing:'linear',fill:'forwards'});
  element.style.visibility='visible';
  const reveal=setTimeout(onReveal,900),finish=setTimeout(onFinished,1000);
  const skip=()=>{if(document.hidden||reduced.matches){onReveal();onFinished();}};
  document.addEventListener('visibilitychange',skip);reduced.addEventListener('change',skip);
  return()=>{clearTimeout(reveal);clearTimeout(finish);animation.cancel();glass?.cancel();document.removeEventListener('visibilitychange',skip);reduced.removeEventListener('change',skip);};
 },[ready,enabled,portrait,onReveal,onFinished]);
 return <div className="ufo-arrival" aria-hidden="true"><div ref={node} className="ufo-arrival-model">
  <svg viewBox="0 0 1000 600" width="100%" height="100%">
   <defs>
    <linearGradient id={`${id}metal`} x2="0" y2="1"><stop stopColor="#a6afa6"/><stop offset=".35" stopColor="#718383"/><stop offset=".6" stopColor="#43545c"/><stop offset="1" stopColor="#273842"/></linearGradient>
    <radialGradient id={`${id}glass`} cx=".4" cy=".15" r=".9"><stop stopColor="#a4d3d4" stopOpacity=".48"/><stop offset=".55" stopColor="#386274" stopOpacity=".28"/><stop offset="1" stopColor="#6c9fba" stopOpacity=".58"/></radialGradient>
    <radialGradient id={`${id}lamp`}><stop stopColor="#fff0bb"/><stop offset=".6" stopColor="#ffd28a"/><stop offset="1" stopColor="#b3793b"/></radialGradient>
   </defs>
   <path data-arrival-glass d="M190 352 A310 310 0 0 1 810 352 Z" fill={`url(#${id}glass)`} stroke="#91adb7" strokeWidth="5"/>
   <ellipse cx="500" cy="385" rx="480" ry="104" fill={`url(#${id}metal)`} stroke="#26373e" strokeWidth="4"/>
   <path d="M20 379 Q500 265 980 379 Q500 426 20 379Z" fill="#83938d" stroke="#c7ad76" strokeWidth="3"/>
   <path d="M42 390 Q500 448 958 390" fill="none" stroke="#283b43" strokeWidth="4"/>
   {[-3,-2,-1,1,2,3].map(i=><path key={i} d={`M${500+i*112} 331 L${500+i*150} 392 L${500+i*95} 463`} fill="none" stroke="#34464d" strokeWidth="2" opacity=".5"/>)}
   <ellipse cx="500" cy="467" rx="135" ry="19" fill="#33464a" stroke="#947a4d" strokeWidth="3"/>
   <ellipse cx="500" cy="468" rx="93" ry="11" fill="#79d9ff" stroke="#d5f7ff" strokeWidth="2"/>
   {[130,285,715,870].map(x=><ellipse key={x} cx={x} cy={x<200||x>800?405:435} rx="22" ry="8" fill={`url(#${id}lamp)`} stroke="#a77c45" strokeWidth="3"/>)}
  </svg>
 </div></div>;
}
