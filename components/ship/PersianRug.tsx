import { memo } from 'react';
import type { DomeConfig, Viewport } from '@/lib/ship/domeGeometry';
import { ROOM, floorPortDiameter, polygonPath } from '@/lib/ship/roomGeometry';

/** All ornament is on the floor plane, including the individual fringe threads. */
export const PersianRug=memo(function PersianRug({config,view}:{config:DomeConfig;view:Viewport}) {
 const point=(x:number,z:number)=>({x:ROOM.port.x+x,y:ROOM.floorY+.002,z:ROOM.port.z+z});
 const path=(xy:number[][])=>polygonPath(xy.map(([x,z])=>point(x,z)),config,view);
 const ring=(r:number)=>path(Array.from({length:145},(_,i)=>{const a=i/144*Math.PI*2;return [r*Math.cos(a),r*Math.sin(a)];}));
 const hole=ring(floorPortDiameter/2+.035);
 const flower=(r:number,a:number,size:number,index:number)=>{
  const x=r*Math.cos(a),z=r*Math.sin(a);
  const petals=Array.from({length:33},(_,j)=>{const t=j/32*Math.PI*2,q=size*(.72+.23*Math.cos(8*t));return [x+q*Math.cos(t),z+q*Math.sin(t)];});
  return <g key={index}><path d={path(petals)} fill={index%3?'#bb8859':'#72908c'} stroke="#d3b17c" strokeWidth=".5"/><path d={path([[x,z-size*.35],[x+size*.35,z],[x,z+size*.35],[x-size*.35,z]])} fill="#773e30"/></g>;
 };
 return <g aria-label="Circular Persian rug centred on the unobstructed floor hatch" pointerEvents="none">
  {Array.from({length:240},(_,i)=>{const a=i/240*Math.PI*2,r=2.43+(i%4)*.007;return <path key={i} d={path([[2.365*Math.cos(a),2.365*Math.sin(a)],[r*Math.cos(a+.002),r*Math.sin(a+.002)]])} fill="none" stroke={i%3?'#bba37a':'#877559'} strokeWidth=".65"/>;})}
  {[[2.38,'#3a2927'],[2.34,'#bc8b58'],[2.29,'#813f2e'],[2.2,'#bc8b58'],[2.17,'#253d45'],[1.94,'#ba8051'],[1.9,'#743629'],[.92,'#bf8f5c'],[.86,'#2a4147'],[.69,'#ad734c']].map(([r,c])=><path key={r} d={`${ring(Number(r))} ${hole}`} fill={String(c)} fillRule="evenodd"/>)}
  {[{r:2.265,n:72,s:.035},{r:2.055,n:48,s:.088},{r:1.72,n:30,s:.11},{r:1.37,n:24,s:.12},{r:1.06,n:20,s:.075},{r:.77,n:22,s:.045}].map(({r,n,s},row)=><g key={r}>
   <path d={path(Array.from({length:n*8+1},(_,i)=>{const a=i/(n*8)*Math.PI*2,q=r+.035*Math.sin(a*n);return [q*Math.cos(a),q*Math.sin(a)];}))} fill="none" stroke="#b48b5e" strokeWidth=".65"/>
   {Array.from({length:n},(_,i)=>{const a=(i+.3*(row%2))/n*Math.PI*2;return flower(r+.012*Math.sin(i*7),a,s*(1+.07*Math.sin(i*3)),i);})}
   {Array.from({length:n},(_,i)=>{const a=(i+.5)/n*Math.PI*2;const xy=(q:number,t:number)=>[q*Math.cos(t),q*Math.sin(t)];return <path key={i} d={path([xy(r-.06,a),xy(r-.14,a+.025),xy(r-.2,a),xy(r-.14,a-.025)])} fill="#7b8762" stroke="#b59b6b" strokeWidth=".4"/>;})}
  </g>)}
 </g>;
});
