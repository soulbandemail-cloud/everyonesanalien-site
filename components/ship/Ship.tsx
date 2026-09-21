'use client';
import { useState } from 'react';
import type { DomeConfig, Viewport } from '@/lib/ship/domeGeometry';
import type { HullConfig } from '@/lib/ship/hullGeometry';
import { ExteriorHull } from './ExteriorHull';
import { Dome } from './Dome';
import { PilotMezzanine } from './PilotMezzanine';
import { CockpitFloor, ManifestationPort } from './CockpitFloor';
import { Fixtures } from './Fixtures';
import { GeometryCalibration } from './GeometryCalibration';
import styles from './ship.module.css';

export default function Ship({ config, baseline, onConfigChange, hull, onHullChange, view, reveal=1, development=false, preview=false, logout, busy }: {
 config:DomeConfig; baseline:DomeConfig; onConfigChange:(config:DomeConfig)=>void;
 hull:HullConfig; onHullChange:(hull:HullConfig)=>void; view:Viewport;
 reveal?:number; development?:boolean; preview?:boolean; logout?:()=>void; busy?:boolean;
}) {
 const [debug,setDebug]=useState(false);
 const [grid,setGrid]=useState(true);
 return <div className={styles.ship} style={{opacity:Math.max(0,Math.min(1,(reveal-.12)/.6))}} aria-label="Mate cockpit">
  <div className={styles.space} aria-hidden="true">{Array.from({ length: 75 }, (_, i) => <i key={i} style={{ left: `${(i * 73.31) % 100}%`, top: `${(i * 31.71) % 75}%`, opacity: .2 + i % 5 * .14 }} />)}</div>
  <Dome config={config} view={view} debug={development && debug && grid} />
  <ExteriorHull config={config} hull={hull} view={view} />
  <CockpitFloor config={config} view={view} />
  <Fixtures config={config} view={view} />
  <PilotMezzanine attention={{x:0,back:0,down:0}} config={config} view={view} />
  <ManifestationPort config={config} view={view} />
  <header className={styles.toolbar}>
    <span>{preview ? 'DEVELOPMENT PREVIEW · NO MATE SESSION' : ''}</span>
    {logout && <button onClick={logout} disabled={busy}>{busy ? 'LOGGING OUT…' : 'LOG OUT'}</button>}
    {development && <button aria-pressed={debug} onClick={()=>setDebug(!debug)}>Geometry {debug ? 'on' : 'off'}</button>}
  </header>
  {development && debug && <GeometryCalibration hull={hull} onHullChange={onHullChange} config={baseline} view={view} onChange={onConfigChange} grid={grid} onGridChange={setGrid} />}
 </div>;
}
