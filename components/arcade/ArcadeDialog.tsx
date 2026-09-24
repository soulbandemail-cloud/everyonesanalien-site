'use client';
import { useEffect, useRef, useState } from 'react';
import { portraitFrame } from './presentation';
import type { CSSProperties } from 'react';
import ArcadeGame from './ArcadeGame';

/** Full viewport deliberately preserves the original game's pixel coordinate space. */
export default function ArcadeDialog({ onExit, viewport }: { onExit: () => void; viewport?: {view:{width:number;height:number};mobile:boolean;left:number;top:number} }) {
  const frame=viewport ? portraitFrame(viewport.view.width,viewport.view.height,viewport.mobile) : null;
  const dialog = useRef<HTMLDialogElement>(null);
  const [round, setRound] = useState(0);
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element?.showModal();
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      if (previousFocus instanceof HTMLElement || previousFocus instanceof SVGElement) previousFocus.focus();
    };
  }, []);
  return <dialog ref={dialog} className="arcade-dialog" aria-label="SOUL arcade" onCancel={event => { event.preventDefault(); onExit(); }}>
    <div data-arcade-frame={viewport?.mobile ? '' : undefined} data-arcade-rotated={frame?.rotated} data-arcade-width={frame?.width} data-arcade-height={frame?.height} style={viewport?.mobile && frame ? {position:'absolute',left:viewport.left,top:viewport.top,width:frame.width,height:frame.height,transformOrigin:'0 0',transform:frame.rotated?`translateX(${frame.height}px) rotate(90deg)`:'translate(0)', '--arcade-vw':`${frame.width/100}px`,'--arcade-height':`${frame.height}px`,'--arcade-vh':`${frame.height/100}px`} as CSSProperties : undefined}>
    <div className="arcade-controls" data-arcade-controls onPointerDown={event => event.stopPropagation()}>
      <button type="button" onClick={onExit} autoFocus>EXIT ARCADE</button>
    </div>
    <ArcadeGame key={round} onRestart={() => setRound(value => value + 1)} />
    </div>
  </dialog>;
}
