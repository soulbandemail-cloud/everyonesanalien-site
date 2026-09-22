'use client';
import { useEffect, useRef, useState } from 'react';
import ArcadeGame from './ArcadeGame';

/** Full viewport deliberately preserves the original game's pixel coordinate space. */
export default function ArcadeDialog({ onExit }: { onExit: () => void }) {
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
    <div className="arcade-controls" data-arcade-controls onPointerDown={event => event.stopPropagation()}>
      <button type="button" onClick={onExit} autoFocus>EXIT ARCADE</button>
    </div>
    <ArcadeGame key={round} onRestart={() => setRound(value => value + 1)} />
  </dialog>;
}
