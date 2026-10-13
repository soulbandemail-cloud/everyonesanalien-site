'use client';
import {useEffect,useState} from 'react';

/** A brief, non-blocking reminder; it never changes the device orientation. */
export default function RotationReminder({hidden=false}:{hidden?:boolean}){
 const [visible,setVisible]=useState(true);
 useEffect(()=>{const timer=window.setTimeout(()=>setVisible(false),9000);return()=>window.clearTimeout(timer);},[]);
 if(!visible||hidden)return null;
 return <div className="rotation-reminder" role="status" aria-label="Lock rotation">
  <div className="rotation-reminder-sign">
   <svg viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M49 49A25 25 0 1 1 56 30"/>
    <path d="M49 40v10h10"/>
    <rect x="23" y="29" width="20" height="17" rx="3"/>
    <path d="M27 29v-9a7 7 0 0 1 14 0v2"/>
    <path d="M33 36v4"/>
   </svg>
   <span>LOCK<br/>ROTATION</span>
  </div>
 </div>;
}
