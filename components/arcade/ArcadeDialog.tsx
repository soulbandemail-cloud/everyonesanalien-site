'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { landscapeFrame, portraitFrame } from './presentation';
import type { CSSProperties } from 'react';
import {restoreObjectFocus} from '@/components/mate/objectInteraction';
import ArcadeGame from './ArcadeGame';
import PolemanArena from './PolemanArena';

/** Full viewport deliberately preserves the original game's pixel coordinate space. */
export default function ArcadeDialog({ onExit, viewport }: { onExit: () => void; viewport?: {view:{width:number;height:number};mobile:boolean;left:number;top:number} }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [round, setRound] = useState(0);
  const [boss,setBoss]=useState(false);
  const [whiteout,setWhiteout]=useState(false);
  const frame=viewport ? (boss?landscapeFrame:portraitFrame)(viewport.view.width,viewport.view.height,viewport.mobile) : null;
  const edgeColor=boss?(whiteout?'#ffffff':'#000000'):'#00082d';
  const showWhiteout=useCallback(()=>setWhiteout(true),[]);
  const defeat=useCallback(()=>{setWhiteout(false);setBoss(false);setRound(n=>n+1);},[]);
  const victory=useCallback(()=>{try{localStorage.setItem("bossDefeated","true");}catch{}window.dispatchEvent(new Event("poleman-reward"));onExit();},[onExit]);
  useLayoutEffect(()=>{
    if(!viewport?.mobile)return;
    const root=document.documentElement,body=document.body;
    const publish=(color:string)=>{
      document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach(meta=>{
        meta.content=color;
        // Replace the metadata node as well as its value to invalidate Safari's cached tint.
        meta.replaceWith(meta.cloneNode(true));
      });
    };
    root.style.backgroundColor=edgeColor;body.style.backgroundColor=edgeColor;publish(edgeColor);
    return()=>{root.style.backgroundColor='#00082d';body.style.backgroundColor='#00082d';publish('#00082d');};
  },[viewport?.mobile,edgeColor]);
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
  return <dialog ref={dialog} className="arcade-dialog" style={{'--arcade-edge-color':edgeColor} as CSSProperties} data-boss={boss} data-mobile={viewport?.mobile||undefined} aria-label="SOUL arcade" onCancel={event => { event.preventDefault(); if(!boss)onExit(); }}>
    <div data-arcade-frame={viewport?.mobile ? '' : undefined} data-arcade-rotated={frame?.rotated} data-arcade-flipped={viewport?.mobile&&boss||undefined} data-arcade-width={frame?.width} data-arcade-height={frame?.height} style={viewport?.mobile && frame ? {position:'absolute',left:viewport.left,top:viewport.top,width:frame.width,height:frame.height,transformOrigin:'0 0',transform:(frame.rotated?`translateX(${frame.height}px) rotate(90deg)`:'translate(0)')+(boss?` translate(${frame.width}px, ${frame.height}px) rotate(180deg)`:''), '--arcade-vw':`${frame.width/100}px`,'--arcade-height':`${frame.height}px`,'--arcade-vh':`${frame.height/100}px`} as CSSProperties : undefined}>
    {!boss&&<div className="arcade-controls" data-arcade-controls onPointerDown={event => event.stopPropagation()}>
      <button className="object-back" type="button" onClick={onExit} autoFocus>BACK</button>
    </div>}
    {boss?<PolemanArena onDefeat={defeat} onVictory={victory} onWhiteout={showWhiteout}/>:<ArcadeGame key={round} onOvercharge={()=>{setWhiteout(false);setBoss(true);}} onRestart={() => setRound(value => value + 1)} />}
    </div>
    {viewport?.mobile&&<div className="arcade-browser-edges" aria-hidden="true"/>}
  </dialog>;
}
