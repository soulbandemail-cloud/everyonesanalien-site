'use client';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { isMobileViewport, viewportLandscape } from '@/lib/ship/mobilePresentation';

export function usePresentationViewport(ready: Dispatch<SetStateAction<boolean>>, mobilePreview=false) {
 const [viewport,setViewport]=useState({view:{width:1440,height:900},mobile:false,landscape:true,left:0,top:0});
 useEffect(()=>{
  const coarse=window.matchMedia('(any-pointer: coarse)');
  let frame=0;
  const measure=()=>{
   frame=0;
   const layout={width:window.innerWidth,height:window.innerHeight};
   const mobile=mobilePreview || isMobileViewport(layout,coarse.matches,navigator.maxTouchPoints);
   const vv=window.visualViewport;
   const landscape=viewportLandscape(layout,mobilePreview ? undefined : screen.orientation?.type);
   const next={landscape,view:mobile && vv ? {width:vv.width,height:vv.height} : layout,mobile,left:mobile ? vv?.offsetLeft ?? 0 : 0,top:mobile ? vv?.offsetTop ?? 0 : 0};
   setViewport(old=>JSON.stringify(old)===JSON.stringify(next) ? old : next);
   ready(true);
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(measure);};
  const observer=new ResizeObserver(schedule);observer.observe(document.documentElement);
  screen.orientation?.addEventListener('change',schedule);
  window.addEventListener('resize',schedule);window.addEventListener('orientationchange',schedule);
  window.visualViewport?.addEventListener('resize',schedule);window.visualViewport?.addEventListener('scroll',schedule);
  coarse.addEventListener('change',schedule);schedule();
  return ()=>{screen.orientation?.removeEventListener('change',schedule);cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',schedule);window.removeEventListener('orientationchange',schedule);window.visualViewport?.removeEventListener('resize',schedule);window.visualViewport?.removeEventListener('scroll',schedule);coarse.removeEventListener('change',schedule);};
 },[ready,mobilePreview]);
 return viewport;
}
