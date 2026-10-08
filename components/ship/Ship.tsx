'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { project, type DomeConfig, type Viewport } from '@/lib/ship/domeGeometry';
import type { HullConfig } from '@/lib/ship/hullGeometry';
import { alienNodTarget, alienFacingTarget, alienLookYaw } from '@/lib/ship/alienVolume';
import { ROOM, pilotPosition, polygonPath } from '@/lib/ship/roomGeometry';
import {useCharlieMovement} from './useCharlieMovement';
import {WalkingCharlie} from './WalkingCharlie';
import {floorPoint} from '@/lib/ship/charlieNavigation';
import { ExteriorHull } from './ExteriorHull';
import { Dome } from './Dome';
import { PilotMezzanine } from './PilotMezzanine';
import { CockpitFloor, ManifestationPort } from './CockpitFloor';
import { Fixtures } from './Fixtures';
import { GeometryCalibration } from './GeometryCalibration';
import type {DomeMenu} from '@/lib/ship/domeNavigation';
import styles from './ship.module.css';

export default function Ship({ config, baseline, onConfigChange, hull, onHullChange, view, domeConfig=config, sharedSeam=false, reveal=1, development=false, preview=false, logout, busy, onArcade, onTV, onNewsletter, onShows, onMerch, domeMenu=null, liveTv=false, onTvLayer }: {
 config:DomeConfig; baseline:DomeConfig; onConfigChange:(config:DomeConfig)=>void;
 hull:HullConfig; onHullChange:(hull:HullConfig)=>void; view:Viewport;
 domeConfig?:DomeConfig; sharedSeam?:boolean; reveal?:number; development?:boolean; preview?:boolean; logout?:()=>void; busy?:boolean; onArcade?:()=>void; onTV?:()=>void; onNewsletter?:()=>void; onShows?:()=>void; onMerch?:()=>void; domeMenu?:DomeMenu; liveTv?:boolean; onTvLayer?:(node:HTMLDivElement|null)=>void;
}) {
 const [attention, setAttention] = useState({ x: 0, back: 0, down: 0 });
 const movement=useCharlieMovement(config,alienLookYaw(attention.x,attention.back));
 const {interact}=movement;
 const actions=useMemo(()=>({
  shows:onShows?()=>interact('shows',onShows):undefined,
  merch:onMerch?()=>interact('merch',onMerch):undefined,
  arcade:onArcade?()=>interact('arcade',onArcade):undefined,
  tv:onTV?()=>interact('tv',onTV):undefined,
  newsletter:onNewsletter?()=>interact('newsletter',onNewsletter):undefined,
  chair:()=>interact('chair'),
 }),[interact,onShows,onMerch,onArcade,onTV,onNewsletter]);
 const root = useRef<HTMLDivElement>(null);
 const pointer = useRef({ x: 0, y: .25 });
 useEffect(() => {
  const pilot=project({...pilotPosition,y:pilotPosition.y+ROOM.pilotSeatLift},config,view);
  const alienHeight=ROOM.alienHeight*pilot.scale;
  // Neutral antenna tips are at drawing y=-15.5 in the 250-unit occupant.
  const antennaY=(pilot.y-alienHeight*1.062)/view.height;
  const turnRange=alienHeight*.6/view.height;
  // Observe movement without making the click-through room overlay a hit target.
  const reset = () => { pointer.current = { x: 0, y: .25 }; };
  const move = (event: PointerEvent) => {
   const bounds = root.current?.getBoundingClientRect();
   if (!bounds || !bounds.width || !bounds.height) return;
   if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) { reset(); return; }
   const scene=root.current?.closest<HTMLElement>('[data-cockpit-presentation]');
   const angle=Number(scene?.dataset.presentationAngle ?? 0)*Math.PI/180;
   const dx=event.clientX-bounds.left-bounds.width/2,dy=event.clientY-bounds.top-bounds.height/2;
   const scale=Number(scene?.dataset.presentationScale ?? 1);
   const width=root.current!.clientWidth*scale,height=root.current!.clientHeight*scale;
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
   const target = { x: Math.tanh(pointer.current.x * 1.5), back: alienFacingTarget(pointer.current.y,antennaY,turnRange), down: alienNodTarget(pointer.current.x,pointer.current.y) };
   setAttention(old => ({ x: old.x + (target.x - old.x) * ease, back: old.back + (target.back - old.back) * ease, down: old.down + (target.down - old.down) * (reduced.matches ? 1 : 1-Math.exp(-dt*9)) }));
   id = requestAnimationFrame(tick);
  }
  id = requestAnimationFrame(tick);
  return () => {
   cancelAnimationFrame(id);
   window.removeEventListener('pointermove', move, true);
   window.removeEventListener('pointerout', leave);
   window.removeEventListener('blur', reset);
  };
 }, [config,view]);
 const [debug,setDebug]=useState(false);
 const [grid,setGrid]=useState(true);
 return <div ref={root} className={styles.ship} style={{...(sharedSeam ? {width:view.width,height:view.height} : {}),opacity:Math.max(0,Math.min(1,(reveal-.12)/.6))}} aria-label="Mate cockpit">
  <Dome config={domeConfig} view={view} debug={development && debug && grid} />
  <ExteriorHull config={config} hull={hull} view={view} sharedSeam={sharedSeam} />
  <CockpitFloor config={config} view={view} sharedSeam={sharedSeam} />
  <svg width={view.width} height={view.height} style={{position:'absolute',inset:0,zIndex:5,pointerEvents:'none'}} aria-label="Walkable cockpit floor">
   <path d={polygonPath(Array.from({length:97},(_,i)=>({x:config.centre.x+(config.radius-.65)*Math.sin(i/96*Math.PI*2),y:ROOM.floorY,z:config.centre.z+(config.radius-.65)*Math.cos(i/96*Math.PI*2)})),config,view)} fill="transparent" style={{pointerEvents:reveal===1?'all':'none',cursor:'crosshair'}} onClick={event=>{
    const bounds=root.current!.getBoundingClientRect(),scene=root.current?.closest<HTMLElement>('[data-cockpit-presentation]'),angle=Number(scene?.dataset.presentationAngle??0)*Math.PI/180,scale=Number(scene?.dataset.presentationScale??1);
    const dx=event.clientX-bounds.left-bounds.width/2,dy=event.clientY-bounds.top-bounds.height/2;
    const x=(dx*Math.cos(angle)+dy*Math.sin(angle))/scale+view.width/2,y=(-dx*Math.sin(angle)+dy*Math.cos(angle))/scale+view.height/2;
    const point=floorPoint(x,y,config,view);if(point)movement.walk(point);
   }}/>
  </svg>
  <Fixtures reading={movement.state.paper>0} onShows={actions.shows} onMerch={actions.merch} domeMenu={domeMenu} config={config} view={view} onArcade={actions.arcade} onTV={actions.tv} onNewsletter={actions.newsletter} liveTv={liveTv} />
  <PilotMezzanine attention={attention} config={config} view={view} seated={movement.state.mode==='pilot-seated'&&!movement.state.phase} onChair={reveal===1?actions.chair:undefined} />
  <div className="cockpit-tv-layer" ref={onTvLayer} style={{position:'absolute',inset:0,zIndex:7,pointerEvents:'none','--tv-frame-width':view.width+'px','--tv-frame-height':view.height+'px'} as React.CSSProperties}/>
  <WalkingCharlie state={movement.state} config={config} view={view}/>
  <ManifestationPort config={config} view={view} />
  <header className={styles.toolbar}>
    <span className={styles.alpha}>alpha{preview && <small className={styles.previewLabel}>DEVELOPMENT PREVIEW · NO MATE SESSION</small>}</span>
    {logout && <button className="cockpit-logout" onClick={logout} disabled={busy}>{busy ? 'LOGGING OUT…' : 'LOG OUT'}</button>}
    {development && <button aria-pressed={debug} onClick={()=>setDebug(!debug)}>Geometry {debug ? 'on' : 'off'}</button>}
  </header>
  {development && debug && <GeometryCalibration hull={hull} onHullChange={onHullChange} config={baseline} view={view} onChange={onConfigChange} grid={grid} onGridChange={setGrid} />}
 </div>;
}
