'use client';
import { useEffect, useRef, useState } from 'react';
import type { DomeConfig, Viewport } from '@/lib/ship/domeGeometry';
import type { HullConfig } from '@/lib/ship/hullGeometry';
import { ExteriorHull } from './ExteriorHull';
import { Dome } from './Dome';
import { PilotMezzanine } from './PilotMezzanine';
import { CockpitFloor, ManifestationPort } from './CockpitFloor';
import { Fixtures } from './Fixtures';
import { GeometryCalibration } from './GeometryCalibration';
import styles from './ship.module.css';
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smoothstep = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };

export default function Ship({ config, baseline, onConfigChange, hull, onHullChange, view, domeConfig=config, sharedSeam=false, reveal=1, development=false, preview=false, logout, busy, onArcade }: {
 config:DomeConfig; baseline:DomeConfig; onConfigChange:(config:DomeConfig)=>void;
 hull:HullConfig; onHullChange:(hull:HullConfig)=>void; view:Viewport;
 domeConfig?:DomeConfig; sharedSeam?:boolean; reveal?:number; development?:boolean; preview?:boolean; logout?:()=>void; busy?:boolean; onArcade?:()=>void;
}) {
 const root = useRef<HTMLDivElement>(null);
 const pointer = useRef({ x: 0, y: .25 });
 const [attention, setAttention] = useState({ x: 0, back: 0, down: 0 });
 useEffect(() => {
  // Observe movement without making the click-through room overlay a hit target.
  const reset = () => { pointer.current = { x: 0, y: .25 }; };
  const move = (event: PointerEvent) => {
   const bounds = root.current?.getBoundingClientRect();
   if (!bounds || !bounds.width || !bounds.height) return;
   if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) { reset(); return; }
   const scene=root.current?.closest<HTMLElement>('[data-cockpit-presentation]');
   const angle=Number(scene?.dataset.presentationAngle ?? 0)*Math.PI/180;
   const dx=event.clientX-bounds.left-bounds.width/2,dy=event.clientY-bounds.top-bounds.height/2;
   const width=root.current!.clientWidth,height=root.current!.clientHeight;
   pointer.current = { x: (dx*Math.cos(angle)+dy*Math.sin(angle))/width*2, y: (-dx*Math.sin(angle)+dy*Math.cos(angle))/height+.5 };
  };
  const leave = (event: PointerEvent) => { if (event.relatedTarget === null) reset(); };
  window.addEventListener('pointermove', move, { passive: true, capture: true });
  window.addEventListener('pointerout', leave, { passive: true });
  window.addEventListener('blur', reset);
  let id = 0; let previous = 0;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  function tick(time: number) {
   const dt = previous ? Math.min((time - previous) / 1000, .05) : 0; previous = time;
   const ease = reduced.matches ? 1 : 1 - Math.exp(-dt * 5);
   const target = { x: Math.tanh(pointer.current.x * 1.5), back: smoothstep((pointer.current.y - .5) / .37), down: smoothstep((pointer.current.y - .76) / .24) };
   setAttention(old => ({ x: old.x + (target.x - old.x) * ease, back: old.back + (target.back - old.back) * ease, down: old.down + (target.down - old.down) * ease }));
   id = requestAnimationFrame(tick);
  }
  id = requestAnimationFrame(tick);
  return () => {
   cancelAnimationFrame(id);
   window.removeEventListener('pointermove', move, true);
   window.removeEventListener('pointerout', leave);
   window.removeEventListener('blur', reset);
  };
 }, []);
 const [debug,setDebug]=useState(false);
 const [grid,setGrid]=useState(true);
 return <div ref={root} className={styles.ship} style={{...(sharedSeam ? {width:view.width,height:view.height} : {}),opacity:Math.max(0,Math.min(1,(reveal-.12)/.6))}} aria-label="Mate cockpit">
  <Dome config={domeConfig} view={view} debug={development && debug && grid} />
  <ExteriorHull config={config} hull={hull} view={view} sharedSeam={sharedSeam} />
  <CockpitFloor config={config} view={view} sharedSeam={sharedSeam} />
  <Fixtures config={config} view={view} onArcade={onArcade} />
  <PilotMezzanine attention={attention} config={config} view={view} />
  <ManifestationPort config={config} view={view} />
  <header className={styles.toolbar}>
    <span>{preview ? 'DEVELOPMENT PREVIEW · NO MATE SESSION' : ''}</span>
    {logout && <button onClick={logout} disabled={busy}>{busy ? 'LOGGING OUT…' : 'LOG OUT'}</button>}
    {development && <button aria-pressed={debug} onClick={()=>setDebug(!debug)}>Geometry {debug ? 'on' : 'off'}</button>}
  </header>
  {development && debug && <GeometryCalibration hull={hull} onHullChange={onHullChange} config={baseline} view={view} onChange={onConfigChange} grid={grid} onGridChange={setGrid} />}
 </div>;
}
