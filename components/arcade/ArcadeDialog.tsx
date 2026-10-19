'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { portraitFrame } from './presentation';
import type { CSSProperties } from 'react';
import {restoreObjectFocus} from '@/components/mate/objectInteraction';
import ArcadeGame from './ArcadeGame';
import PolemanArena from './PolemanArena';

/** Full viewport deliberately preserves the original game's pixel coordinate space. */
export default function ArcadeDialog({ onExit, viewport }: { onExit: () => void; viewport?: {view:{width:number;height:number};mobile:boolean;left:number;top:number} }) {
  const frame=viewport ? portraitFrame(viewport.view.width,viewport.view.height,viewport.mobile) : null;
  const dialog = useRef<HTMLDialogElement>(null);
  const [round, setRound] = useState(0);
  const [boss,setBoss]=useState(false);
  const defeat=useCallback(()=>{setBoss(false);setRound(n=>n+1);},[]);
  const victory=useCallback(()=>{try{localStorage.setItem("bossDefeated","true");}catch{}window.dispatchEvent(new Event("poleman-reward"));onExit();},[onExit]);
  useLayoutEffect(()=>{
    if(!viewport?.mobile)return;
    const root=document.documentElement,body=document.body;
    const rootBackground=root.style.backgroundColor,bodyBackground=body.style.backgroundColor;
    const publish=(color:string)=>{
      document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach(meta=>{
        meta.content=color;
        // Replace the metadata node as well as its value to invalidate Safari's cached tint.
        meta.replaceWith(meta.cloneNode(true));
      });
    };
    root.style.backgroundColor='#000000';body.style.backgroundColor='#000000';publish('#000000');
    return()=>{root.style.backgroundColor=rootBackground||'#00082d';body.style.backgroundColor=bodyBackground||'#00082d';publish('#00082d');};
  },[viewport?.mobile,boss]);
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if(element)element.style.visibility='';
    element?.showModal();
    return () => {
      // Drop composited arcade surfaces before closing the top-layer dialog.
      if(element)element.style.visibility='hidden';
      element?.close();
      // iOS Safari may retain the silver footer's sampled toolbar tint after
      // the dialog is removed. Re-publish the existing site theme metadata.
      const theme=document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if(theme)theme.replaceWith(theme.cloneNode(true));
      document.body.style.overflow = overflow;
      restoreObjectFocus(previousFocus);
    };
  }, []);
  return <dialog ref={dialog} className="arcade-dialog" data-boss={boss} data-mobile={viewport?.mobile||undefined} aria-label="SOUL arcade" onCancel={event => { event.preventDefault(); if(!boss)onExit(); }}>
    <div data-arcade-frame={viewport?.mobile ? '' : undefined} data-arcade-rotated={frame?.rotated} data-arcade-width={frame?.width} data-arcade-height={frame?.height} style={viewport?.mobile && frame ? {position:'absolute',left:viewport.left,top:viewport.top,width:frame.width,height:frame.height,transformOrigin:'0 0',transform:frame.rotated?`translateX(${frame.height}px) rotate(90deg)`:'translate(0)', '--arcade-vw':`${frame.width/100}px`,'--arcade-height':`${frame.height}px`,'--arcade-vh':`${frame.height/100}px`} as CSSProperties : undefined}>
    {!boss&&<div className="arcade-controls" data-arcade-controls onPointerDown={event => event.stopPropagation()}>
      <button className="object-back" type="button" onClick={onExit} autoFocus>BACK</button>
    </div>}
    {boss?<PolemanArena onDefeat={defeat} onVictory={victory}/>:<ArcadeGame key={round} onOvercharge={()=>setBoss(true)} onRestart={() => setRound(value => value + 1)} />}
    </div>
    {viewport?.mobile&&<div className="arcade-browser-edges" aria-hidden="true"/>}
  </dialog>;
}
