'use client';
import {useEffect,type RefObject} from 'react';

/** A fresh invitation on each page visit; any click dismisses it. */
export function useDiscoveryPulse(root:RefObject<HTMLDivElement|null>){
 useEffect(()=>{
  const element=root.current;if(!element)return;
  const start=()=>element.setAttribute('data-discovery-pending','true');
  const stop=()=>element.removeAttribute('data-discovery-pending');
  const activateKey=(event:KeyboardEvent)=>{
   if(event.key==='Enter'||event.key===' ')stop();
  };
  start();
  // Also restart when the browser restores the page from its back/forward cache.
  window.addEventListener('pageshow',start);
  document.addEventListener('click',stop,true);
  document.addEventListener('keyup',activateKey,true);
  return()=>{
   stop();
   window.removeEventListener('pageshow',start);
   document.removeEventListener('click',stop,true);
   document.removeEventListener('keyup',activateKey,true);
  };
 },[root]);
}
