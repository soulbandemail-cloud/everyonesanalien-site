'use client';
import { useEffect } from 'react';

/** Restrict browser zoom gestures only while the cockpit owns the presentation. */
export function useCockpitZoomGuard(active:boolean) {
 useEffect(()=>{
  if(!active) return;
  const prevent=(event:Event)=>{if(event.cancelable)event.preventDefault();};
  const wheel=(event:WheelEvent)=>{if(event.ctrlKey || event.metaKey)prevent(event);};
  const key=(event:KeyboardEvent)=>{
   if((event.ctrlKey || event.metaKey) && ['+','=','-','_','0'].includes(event.key)) prevent(event);
  };
  const touch=(event:TouchEvent)=>{if(event.touches.length>1)prevent(event);};
  const options={passive:false,capture:true};
  document.addEventListener('wheel',wheel,options);
  document.addEventListener('keydown',key,true);
  document.addEventListener('gesturestart',prevent,options);
  document.addEventListener('gesturechange',prevent,options);
  document.addEventListener('touchmove',touch,options);
  document.addEventListener('dblclick',prevent,true);
  return ()=>{
   document.removeEventListener('wheel',wheel,true);
   document.removeEventListener('keydown',key,true);
   document.removeEventListener('gesturestart',prevent,true);
   document.removeEventListener('gesturechange',prevent,true);
   document.removeEventListener('touchmove',touch,true);
   document.removeEventListener('dblclick',prevent,true);
  };
 },[active]);
}
