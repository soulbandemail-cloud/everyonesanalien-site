import { memo, useId } from 'react';
import { curvePath, domePoint, type DomeConfig, type Viewport } from '@/lib/ship/domeGeometry';
import styles from './ship.module.css';

/** Reflection marks sampled on the existing sphere, never structural geometry. */
function reflection(config:DomeConfig,view:Viewport,theta:number,low:number,high:number,width:number) {
 const points=[];
 for(const side of [-1,1])for(let i=0;i<=32;i++) {
  const t=side===-1 ? i/32 : 1-i/32;
  const phi=low+(high-low)*t;
  const spread=width*Math.sin(Math.PI*t)**.65;
  const p=domePoint(theta+side*spread,phi,config,view);
  if(p.visible)points.push(`${p.x},${p.y}`);
 }
 return points.length ? `M${points.join(' L')} Z` : '';
}
export const Dome = memo(function Dome({ config, view, debug }: { config: DomeConfig; view: Viewport; debug: boolean }) {
 const id=useId();
 return <svg className={styles.dome} width={view.width} height={view.height} aria-hidden="true">
 <defs>
  <radialGradient id={`${id}-glass`} cx="50%" cy="34%" r="74%">
   <stop offset="0" stopColor="#91b9be" stopOpacity="0" />
   <stop offset=".65" stopColor="#8ebbc1" stopOpacity=".015" />
   <stop offset="1" stopColor="#8cbab5" stopOpacity=".075" />
  </radialGradient>
  <linearGradient id={`${id}-reflection`} x1="0" y1="0" x2="1" y2="1">
   <stop stopColor="#fff0cb" stopOpacity=".11" />
   <stop offset=".55" stopColor="#c6e7df" stopOpacity=".035" />
   <stop offset="1" stopColor="#a6d6df" stopOpacity="0" />
  </linearGradient>
 </defs>
 <rect width={view.width} height={view.height} fill={`url(#${id}-glass)`} />
 <g fill={`url(#${id}-reflection)`}>
  <path d={reflection(config,view,-1.34,.18,1.35,.055)} />
  <path d={reflection(config,view,-1.20,.48,1.38,.014)} />
  <path d={reflection(config,view,1.42,.12,1.21,.035)} />
 </g>
 <path d={curvePath(config,view,.025)} fill="none" stroke="#cce6d9" strokeOpacity=".14" strokeWidth="2" />
 <path d={curvePath(config,view,.035)} fill="none" stroke="#678f96" strokeOpacity=".12" strokeWidth="1" />
 {debug && <g stroke="#a9dace" strokeOpacity=".18" strokeWidth="1" fill="none" strokeDasharray="3 7">{[.15, .3, .45, .6, .8, 1, 1.2, 1.4].map(phi => <path key={phi} d={curvePath(config, view, phi)} />)}{Array.from({ length: 24 }, (_, i) => <path key={i} d={curvePath(config, view, undefined, i * Math.PI / 12)} />)}</g>}
 </svg>;
});
