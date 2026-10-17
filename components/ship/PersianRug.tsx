import { memo } from 'react';
import type { DomeConfig, Viewport } from '@/lib/ship/domeGeometry';
import { ROOM, polygonPath } from '@/lib/ship/roomGeometry';

/** All ornament is on the floor plane, including the individual fringe threads. */
export const PersianRug=memo(function PersianRug({config,view}:{config:DomeConfig;view:Viewport}) {
 const point=(x:number,z:number)=>({x:ROOM.port.x+x,y:ROOM.floorY+.002,z:ROOM.port.z+z});
 const path=(xy:number[][])=>polygonPath(xy.map(([x,z])=>point(x,z)),config,view);
 const ring=(r:number)=>path(Array.from({length:145},(_,i)=>{const a=i/144*Math.PI*2;return [r*Math.cos(a),r*Math.sin(a)];}));

 const flower=(r:number,a:number,size:number,index:number)=>{
  const x=r*Math.cos(a),z=r*Math.sin(a);
  const petals=Array.from({length:33},(_,j)=>{const t=j/32*Math.PI*2,q=size*(.72+.23*Math.cos(8*t));return [x+q*Math.cos(t),z+q*Math.sin(t)];});
  return <g key={index}><path d={path(petals)} fill={index%3?'#bb8859':'#72908c'} stroke="#d3b17c" strokeWidth=".5"/><path d={path([[x,z-size*.35],[x+size*.35,z],[x,z+size*.35],[x-size*.35,z]])} fill="#773e30"/></g>;
 };
 return <g aria-label="Complete circular Persian rug with woven floral centre medallion" pointerEvents="none">
  {Array.from({length:240},(_,i)=>{const a=i/240*Math.PI*2,r=2.43+(i%4)*.007;return <path key={i} d={path([[2.365*Math.cos(a),2.365*Math.sin(a)],[r*Math.cos(a+.002),r*Math.sin(a+.002)]])} fill="none" stroke={i%3?'#bba37a':'#877559'} strokeWidth=".65"/>;})}
  {[[2.38,'#3a2927'],[2.34,'#bc8b58'],[2.29,'#813f2e'],[2.2,'#bc8b58'],[2.17,'#253d45'],[1.94,'#ba8051'],[1.9,'#743629'],[.92,'#bf8f5c'],[.86,'#2a4147'],[.69,'#ad734c']].map(([r,c])=><path key={r} d={ring(Number(r))} fill={String(c)} fillRule="evenodd"/>)}
  {[{r:2.265,n:72,s:.035},{r:2.055,n:48,s:.088},{r:1.72,n:30,s:.11},{r:1.37,n:24,s:.12},{r:1.06,n:20,s:.075},{r:.77,n:22,s:.045}].map(({r,n,s},row)=><g key={r}>
   <path d={path(Array.from({length:n*8+1},(_,i)=>{const a=i/(n*8)*Math.PI*2,q=r+.035*Math.sin(a*n);return [q*Math.cos(a),q*Math.sin(a)];}))} fill="none" stroke="#b48b5e" strokeWidth=".65"/>
   {Array.from({length:n},(_,i)=>{const a=(i+.3*(row%2))/n*Math.PI*2;return flower(r+.012*Math.sin(i*7),a,s*(1+.07*Math.sin(i*3)),i);})}
   {Array.from({length:n},(_,i)=>{const a=(i+.5)/n*Math.PI*2;const xy=(q:number,t:number)=>[q*Math.cos(t),q*Math.sin(t)];return <path key={i} d={path([xy(r-.06,a),xy(r-.14,a+.025),xy(r-.2,a),xy(r-.14,a-.025)])} fill="#7b8762" stroke="#b59b6b" strokeWidth=".4"/>;})}
  </g>)}
  {/* The medallion shares the rug's floor projection and existing yarn colours. */}
  <path d={ring(.665)} fill="#d3b17c"/>
  <path d={ring(.638)} fill="#253d45"/>
  {[{r:.59,depth:.035,n:16,fill:'#bc8b58'},{r:.55,depth:.045,n:16,fill:'#743629'},{r:.29,depth:.025,n:12,fill:'#d3b17c'},{r:.255,depth:.025,n:12,fill:'#2a4147'}].map(({r,depth,n,fill})=><path key={r} d={path(Array.from({length:193},(_,i)=>{const a=i/192*Math.PI*2,q=r+depth*Math.cos(n*a);return [q*Math.cos(a),q*Math.sin(a)];}))} fill={fill} stroke="#bb8859" strokeWidth=".45"/>)}
  {Array.from({length:16},(_,i)=>{
   const a=i*Math.PI/8;
   const local=(u:number,v:number)=>[u*Math.cos(a)-v*Math.sin(a),u*Math.sin(a)+v*Math.cos(a)];
   const petal=(start:number,end:number,width:number)=>path(Array.from({length:49},(_,j)=>{const t=j/48*Math.PI*2,u=start+(end-start)*(1-Math.cos(t))/2,v=width*Math.sin(t)*(.7+.3*Math.cos(t));return local(u,v);}));
   return <g key={i}>
    <path d={petal(.265,.545,.063)} fill={i%2?'#72908c':'#bc8b58'} stroke="#d3b17c" strokeWidth=".55"/>
    <path d={petal(.3,.49,.033)} fill="#253d45" stroke="#bb8859" strokeWidth=".4"/>
    <path d={path(Array.from({length:25},(_,j)=>{const t=j/24;return local(.3+t*.23,.025*Math.sin(t*Math.PI*2));}))} fill="none" stroke="#d3b17c" strokeWidth=".45"/>
    {[-1,1].map(side=><path key={side} d={path(Array.from({length:25},(_,j)=>{const t=j/24*Math.PI*2;return local(.4+.045*Math.cos(t),side*(.027+.013*Math.sin(t)));}))} fill="#7b8762"/>)}
    {flower(.59,a+Math.PI/16,.033,i)}
   </g>;
  })}
  {Array.from({length:12},(_,i)=>flower(.185,i*Math.PI/6,.05,i))}
  <path d={ring(.11)} fill="#bc8b58"/>
  {flower(0,0,.095,0)}
  <path d={ring(.026)} fill="#d3b17c"/>
 </g>;
});
