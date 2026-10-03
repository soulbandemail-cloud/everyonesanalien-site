import { memo, useId } from 'react';
import { project, type DomeConfig, type Viewport } from '@/lib/ship/domeGeometry';
import { hullMesh, type HullConfig } from '@/lib/ship/hullGeometry';
import { hullFloorSeamPoint } from '@/lib/ship/hullFloorSeam';
import { polygonPath, ROOM, platformY } from '@/lib/ship/roomGeometry';
import styles from './ship.module.css';

const PARAPET_PANEL_TRIM = '#c1ac8b';
const PARAPET_TRIM_OPACITY = .35;

export const ExteriorHull = memo(function ExteriorHull({config,hull,view,sharedSeam=false}:{config:DomeConfig;hull:HullConfig;view:Viewport;sharedSeam?:boolean}) {
 const id=useId();
 const patches=hullMesh(config,hull,sharedSeam).map(p=>({...p,depth:p.points.reduce((sum,q)=>sum+project(q,config,view).depth,0)/4})).sort((a,b)=>b.depth-a.depth);
 const point=(theta:number,height:number)=>{const p=hullFloorSeamPoint(theta,config);return {...p,y:p.y+height};};
 const band=(a:number,b:number,bottom:number,top:number)=>{
  const points=[];
  for(let i=0;i<=8;i++)points.push(point(a+(b-a)*i/8,top));
  for(let i=8;i>=0;i--)points.push(point(a+(b-a)*i/8,bottom));
  return polygonPath(points,config,view);
 };
 // Use the command deck elevation so the continuous plinth meets its single riser.
 const plinthHeight=platformY-ROOM.floorY;
 const panelBand=(a:number,b:number,bottom:number,top:number)=>band(a,b,bottom+plinthHeight,top+plinthHeight);
 const panels=Array.from({length:40},(_,i)=>({a:i/40*Math.PI*2,b:(i+1)/40*Math.PI*2,depth:project(point((i+.5)/40*Math.PI*2,.3),config,view).depth,i})).sort((a,b)=>b.depth-a.depth);
 return <svg className={styles.exteriorHull} width={view.width} height={view.height} role="img" aria-label="Warm-grey panelled hull rim with recessed panels and warm rectangular lights">
  <defs>
   <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#b1a18b"/><stop offset=".18" stopColor="#81776b"/><stop offset=".7" stopColor="#74695e"/><stop offset="1" stopColor="#9a8b76"/></linearGradient>
   <linearGradient id={`${id}-lamp`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffe6a0"/><stop offset=".5" stopColor="#fff0bd"/><stop offset="1" stopColor="#ffc776"/></linearGradient>
   <linearGradient id={`${id}-depth`} x2="0" y2="1"><stop stopColor="#eed2a1" stopOpacity=".1"/><stop offset=".22" stopColor="#10151b" stopOpacity=".16"/><stop offset="1" stopColor="#080f18" stopOpacity=".36"/></linearGradient>
   <radialGradient id={`${id}-spill`}><stop stopColor="#ffc477" stopOpacity=".23"/><stop offset="1" stopColor="#ffc477" stopOpacity="0"/></radialGradient>
  </defs>
  {patches.map((patch,i)=>{
   const tone=Math.round(155-patch.radial*35+Math.sin(patch.radial*Math.PI)*12);
   const colour=`rgb(${tone+12} ${tone+5} ${tone-7})`;
   return <path key={i} d={polygonPath(patch.points,config,view)} fill={colour} stroke={colour} strokeWidth=".6" />;
  })}
  {panels.map(({a,b,i})=>{
   const step=b-a,lit=i%2===0;
   const inset=panelBand(a+step*.12,b-step*.12,.13,.51);
   const lamp=panelBand(a+step*.29,b-step*.29,.25,.39);
   return <g key={i} strokeLinejoin="round">
    <path d={band(a,b,0,plinthHeight)} fill={`url(#${id}-metal)`} />
    <path d={band(a,b,0,plinthHeight)} fill={PARAPET_PANEL_TRIM} fillOpacity={PARAPET_TRIM_OPACITY} />
    <path d={band(a,b,0,plinthHeight)} fill="none" stroke="#4d4844" strokeWidth="1" />
    <path d={panelBand(a,b,0,.65)} fill={`url(#${id}-metal)`} stroke="#4d4844" strokeWidth="1" />
    <path d={panelBand(a+step*.035,b-step*.035,.06,.58)} fill="none" stroke={PARAPET_PANEL_TRIM} strokeOpacity={PARAPET_TRIM_OPACITY} strokeWidth=".65" />
    <path d={inset} fill="#494a46" stroke="#4c4036" strokeWidth="1.6" />
    <path d={inset} fill="none" stroke="#c3a47b" strokeOpacity=".4" strokeWidth=".6" />
    <path d={panelBand(a,b,0,.65)} fill={`url(#${id}-depth)`} pointerEvents="none"/>
    <path d={band(a,b,0,plinthHeight)} fill={`url(#${id}-depth)`} pointerEvents="none"/>
    {lit && <path d={panelBand(a,b,0,.6)} fill={`url(#${id}-spill)`} pointerEvents="none"/>}
    {lit && <g>
     <path d={lamp} fill="#ffc078" stroke="#ffbc6c" strokeOpacity=".08" strokeWidth="15" />
     <path d={lamp} fill="#ffd391" stroke="#ffb855" strokeOpacity=".19" strokeWidth="7" />
     <path d={lamp} fill={`url(#${id}-lamp)`} stroke="#d29150" strokeWidth="1.3" />
    </g>}
    <path d={panelBand(a,b,.61,.68)} fill="#b9a488" stroke="#5b5146" strokeWidth=".7" />
    <path d={panelBand(a,b,.655,.675)} fill="#ebc896" opacity=".6" />
    {[.08,.92].map(u=>{const p=project(point(a+step*u,.55+plinthHeight),config,view);return p.visible && <circle key={u} cx={p.x} cy={p.y} r={Math.max(.45,Math.min(1.2,p.scale*.012))} fill="#463e36" stroke="#c4ad89" strokeWidth=".35" />;})}
   </g>;
  })}
 </svg>;
});
