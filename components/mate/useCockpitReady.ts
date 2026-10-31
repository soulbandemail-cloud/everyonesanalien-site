'use client';
import {useEffect,useState,type RefObject} from 'react';
/** Gate the interior until its surfaces and decoded sources are ready.
 * The existing space and Planet Heart remain mounted throughout. */
export function useCockpitReady(root:RefObject<HTMLElement|null>,enabled:boolean){
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  if(!enabled||ready)return;
  let frame=0,cancelled=false,settledFrames=0;
  const decoded=new Map<string,boolean>();
  let fontsReady=false;
  void document.fonts.ready.then(()=>{fontsReady=true;});
  const check=()=>{
   if(cancelled)return;
   const scene=root.current;
   let complete=fontsReady&&!!scene?.querySelector('[aria-label="Mate cockpit"]')&&!scene.querySelector('[data-scene-ready="false"]');
   scene?.querySelectorAll('img,image').forEach(element=>{
    const src=element instanceof HTMLImageElement?element.currentSrc||element.src:element.getAttribute('href');
    if(!src)return;
    if(!decoded.has(src)){
     decoded.set(src,false);const image=new Image();image.src=src;
     void image.decode().catch(()=>{}).then(()=>{decoded.set(src,true);});
    }
    if(!decoded.get(src))complete=false;
   });
   settledFrames=complete?settledFrames+1:0;
   if(settledFrames>=2){setReady(true);return;}
   frame=requestAnimationFrame(check);
  };
  frame=requestAnimationFrame(check);
  return()=>{cancelled=true;cancelAnimationFrame(frame);};
 },[root,enabled,ready]);
 return ready;
}
