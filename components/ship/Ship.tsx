'use client';
import { useEffect, useRef, useState } from 'react';
import { DEFAULT_DOME } from '@/lib/ship/domeGeometry';
import { DEFAULT_HULL } from '@/lib/ship/hullGeometry';
import { ExteriorHull } from './ExteriorHull';
import { Dome } from './Dome';
import { DomePage } from './DomePage';
import { PilotMezzanine } from './PilotMezzanine';
import { CockpitFloor, ManifestationPort } from './CockpitFloor';
import { Fixtures } from './Fixtures';
import { GeometryCalibration } from './GeometryCalibration';
import Link from 'next/link';
import styles from './ship.module.css';
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smoothstep = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
export default function Ship() {
 const root = useRef<HTMLElement>(null);
 const pointer = useRef({ x: 0, y: .25 });
 const [view, setView] = useState({ width: 1440, height: 900 });
 const [config, setConfig] = useState(DEFAULT_DOME);
 const [debug, setDebug] = useState(false);
 const [grid, setGrid] = useState(true);
 const [hull, setHull] = useState(DEFAULT_HULL);
 const [frame, setFrame] = useState({ attention: { x: 0, back: 0, down: 0 } });
 useEffect(() => {
  if (!root.current) return;
  const observer = new ResizeObserver(([entry]) => setView({ width: entry.contentRect.width, height: entry.contentRect.height }));
  observer.observe(root.current); return () => observer.disconnect();
 }, []);
 useEffect(() => {
  let id = 0; let previous = 0;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  function tick(time: number) {
   const dt = previous ? Math.min((time - previous) / 1000, .05) : 0; previous = time;
   const ease = reduced.matches ? 1 : 1 - Math.exp(-dt * 5);
   const target = { x: Math.tanh(pointer.current.x * 1.5), back: smoothstep((pointer.current.y - .5) / .37), down: smoothstep((pointer.current.y - .76) / .24) };
   setFrame(old => ({ attention: { x: old.attention.x + (target.x - old.attention.x) * ease, back: old.attention.back + (target.back - old.attention.back) * ease, down: old.attention.down + (target.down - old.attention.down) * ease } }));
   id = requestAnimationFrame(tick);
  }
  id = requestAnimationFrame(tick); return () => cancelAnimationFrame(id);
 }, []);
 return <main ref={root} className={styles.ship} onPointerMove={e => { const r = e.currentTarget.getBoundingClientRect(); pointer.current = { x: (e.clientX - r.left) / r.width * 2 - 1, y: (e.clientY - r.top) / r.height }; }} onPointerLeave={() => { pointer.current = { x: 0, y: .25 }; }}>
  <div className={styles.space} aria-hidden="true">{Array.from({ length: 75 }, (_, i) => <i key={i} style={{ left: `${(i * 73.31) % 100}%`, top: `${(i * 31.71) % 75}%`, opacity: .2 + i % 5 * .14 }} />)}</div>
  <DomePage config={config} view={view} /><Dome config={config} view={view} debug={debug && grid} />
  <ExteriorHull config={config} hull={hull} view={view} />
  <CockpitFloor config={config} view={view} />
  <Fixtures config={config} view={view} />
  <PilotMezzanine attention={frame.attention} config={config} view={view} />
  <ManifestationPort config={config} view={view} />
  <header className={styles.toolbar}><Link href="/">← EAA</Link><span>SHIP / CALIBRATION</span><button aria-pressed={debug} onClick={() => setDebug(!debug)}>Geometry {debug ? 'on' : 'off'}</button></header>
  {debug && <GeometryCalibration hull={hull} onHullChange={setHull} config={config} view={view} onChange={setConfig} grid={grid} onGridChange={setGrid} />}
  <footer className={styles.caption}><span>COCKPIT VIEW / 001</span><p>Move across the glass. Look back into the cockpit.</p><span>GEOMETRY STUDY · SOUL</span></footer>
 </main>;
}
