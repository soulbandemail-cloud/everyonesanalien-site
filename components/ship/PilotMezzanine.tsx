import type { CSSProperties } from 'react';
import { Alien, type Attention } from './Alien';
import styles from './ship.module.css';
import { project, type DomeConfig, type Viewport } from '@/lib/ship/domeGeometry';
import { ROOM, pilotPosition, platformY, pilotDeck, polygonPath } from '@/lib/ship/roomGeometry';

type PilotMezzanineProps = {
 attention: Attention;
 config: DomeConfig;
 view: Viewport;
 /** Future room-object entry point from cockpit view into domepage view. */
 onActivate?: () => void;
};
export function PilotMezzanine({ attention, config, view, onActivate }: PilotMezzanineProps) {
 const floorAnchor = project(pilotPosition, config, view);
 const pilot = project({ ...pilotPosition, y: pilotPosition.y + .18 }, config, view);
 const consoleBase = project({ x: 0, y: .3, z: ROOM.pilotZ + .45 }, config, view);
 const consoleWidth = ROOM.consoleWidth * consoleBase.scale;
 const consoleTop = consoleBase.y - consoleWidth * 210 / 600;
 // The existing control surface stays fixed. Its new opaque fascia terminates
 // on a curved footprint in the actual raised-floor plane.
 const floorEdge = Array.from({ length: 33 }, (_, i) => {
  const fraction = i / 32 * 2 - 1;
  const p = project({ x: fraction * ROOM.consoleWidth * 289 / 600,
   y: platformY, z: ROOM.pilotZ + .45 - .2 * (1 - fraction * fraction) }, config, view);
  return { x: (p.x - consoleBase.x) * 600 / consoleWidth + 300,
   y: (p.y - consoleTop) * 600 / consoleWidth };
 });
 const fascia = `M11 142 Q300 68 589 142 ${[...floorEdge].reverse().map(p => `L${p.x.toFixed(4)} ${p.y.toFixed(4)}`).join(' ')} Z`;
 const consoleHeight = Math.max(210, ...floorEdge.map(p => p.y)) + 2;

 return <div className={styles.pilotMezzanine}>
 <svg className={styles.platform} width={view.width} height={view.height} aria-label="Centred pilot mezzanine with three shallow visual steps" role="img">
  {[0, 1, 2].map(i => {
   const bottom = ROOM.floorY + ROOM.stepRise * i;
   const top = bottom + ROOM.stepRise;
   const deck = pilotDeck(i, top);
   const left = deck[0], right = deck[1];
   return <g key={i} data-step={i + 1}>
    {/* Compact tapered deck; only the front has three shallow visual steps. */}
    <path d={polygonPath(deck, config, view)} fill={i === 2 ? '#344249' : '#405056'} stroke="#617478" />
    <path d={polygonPath([{ ...left, y: bottom }, { ...right, y: bottom }, right, left], config, view)} fill="#26363d" stroke="#718083" />
   </g>;
  })}
 </svg>
 <button type="button" className={styles.consoleObject} style={{ left: consoleBase.x, top: consoleTop, width: consoleWidth, visibility: consoleBase.visible ? 'visible' : 'hidden' }} data-room-object="pilot-console" aria-label="Pilot controls — future domepage view entry" title={onActivate ? 'Enter domepage view' : 'Pilot controls — domepage view entry in a future build'} disabled={!onActivate} onClick={onActivate}>
 <svg viewBox={`0 0 600 ${consoleHeight}`} className={styles.console} role="img" aria-label="Physical pilot controls with switches and dials">
 <defs><linearGradient id="console" x2="0" y2="1"><stop stopColor="#6b7777" /><stop offset="1" stopColor="#2a393f" /></linearGradient></defs>
 <path d={fascia} fill="#1c2a33" stroke="#546666" strokeWidth="2" />
 <path d="M25 68 Q300 -30 575 68 L589 142 Q300 68 11 142 Z" fill="url(#console)" stroke="#9aadaa" strokeWidth="2" />
 {[95, 150, 450, 505].map((x, i) => <g key={x} transform={`translate(${x} ${i === 0 || i === 3 ? 93 : 79})`}><circle r="18" fill="#17232a" stroke="#9caaa1" strokeWidth="3" /><path d="M0 0 L8 -10" stroke="#b9e4cc" strokeWidth="3" /><circle r="3" fill="#abb8ae" /></g>)}
 {[205, 232, 259, 341, 368, 395].map((x, i) => <g key={x}><rect x={x - 8} y="65" width="16" height="26" rx="4" fill="#16232c" /><path d={`M${x} 83 l${i % 2 ? 3 : -3} -17`} stroke="#e2d8bb" strokeWidth="5" strokeLinecap="round" /><circle cx={x} cy="102" r="4" fill={i % 2 ? '#7fffd4' : '#ffb0ff'} /></g>)}
 </svg></button>
 <div className={styles.pilotOccupant} style={{ left: pilot.x, top: pilot.y, width: ROOM.alienWidth * pilot.scale, height: ROOM.alienHeight * pilot.scale, "--seat-lift": `${floorAnchor.y-pilot.y}px`, visibility: pilot.visible ? 'visible' : 'hidden' } as CSSProperties}><Alien attention={attention} /></div>
 </div>;
}
