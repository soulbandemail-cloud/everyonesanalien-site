import {SofaSmoothSurface,type SofaTriangle} from './SofaSmoothSurface';
import {memo,useId} from 'react';
import {project,type DomeConfig,type Viewport,type Vec3} from '@/lib/ship/domeGeometry';
import type {FixturePlacement} from '@/lib/ship/fixtureLayout';

type Props={fixture:FixturePlacement;config:DomeConfig;view:Viewport;x:number;y:number;z:number;w:number;h:number;d:number;kind:'seat'|'back'|'arm'|'base'|'leg'};
const power=(v:number,e:number)=>Math.sign(v)*Math.abs(v)**e;
/** Rounded, padded world-space solids. The seating crown stays at the original .59 height. */
export const SofaUpholstery=memo(function SofaUpholstery({fixture:f,config,view,x,y,z,w,h,d,kind}:Props){
 const id=useId(),half=[w/2,h/2,d/2],exponent=kind==='arm'?.48:kind==='seat'?.48:kind==='back'?.38:.27;
 const world=(p:number[]):Vec3=>({x:f.x+f.scale*((x+p[0])*Math.cos(f.yaw)+(z+p[2])*Math.sin(f.yaw)),y:f.y+f.scale*(y+h/2+p[1]),z:f.z+f.scale*((z+p[2])*Math.cos(f.yaw)-(x+p[0])*Math.sin(f.yaw))});
 const projected=(p:number[])=>project(world(p),config,view);
 const path=(points:number[][])=>points.map((p,i)=>{const q=projected(p);return `${i?'L':'M'}${q.x},${q.y}`;}).join(' ')+'Z';
 if(kind==='leg'){
  const bottom=(a:number,b:number)=>[a*w*.34,-h/2,b*d*.34],top=(a:number,b:number)=>[a*w/2,h/2,b*d/2];
  const sides=[[-1,-1,1,-1],[1,-1,1,1],[1,1,-1,1],[-1,1,-1,-1]].map(([a,b,c,e])=>[bottom(a,b),bottom(c,e),top(c,e),top(a,b)]);
  sides.sort((a,b)=>b.reduce((s,p)=>s+projected(p).depth,0)-a.reduce((s,p)=>s+projected(p).depth,0));
  return <g pointerEvents="none"><defs><linearGradient id={id}><stop stopColor="#49301f"/><stop offset=".45" stopColor="#8c603b"/><stop offset="1" stopColor="#5a3a25"/></linearGradient></defs>{sides.map((p,i)=><path key={i} d={path(p)} fill={`url(#${id})`} stroke="#3e2d20" strokeWidth=".45"/>)}<path d={path([[-w*.16,-h*.35,-d/2],[-w*.1,h*.35,-d/2]])} fill="none" stroke="#b18a58" strokeWidth=".4" opacity=".4"/></g>;
 }
 // Every cushion is a complete closed padded volume, including its inner end cap.
 const surface=(lat:number,lon:number)=>[
  half[0]*power(Math.cos(lat),exponent)*power(Math.cos(lon),exponent),
  half[1]*power(Math.sin(lat),exponent),
  half[2]*power(Math.cos(lat),exponent)*power(Math.sin(lon),exponent),
 ];
 const vertex=(lat:number,lon:number)=>{
  const p=surface(lat,lon);
  const n=p.map((v,i)=>power(v/half[i],2/exponent-1)/half[i]),length=Math.hypot(...n)||1;
  const nx=(n[0]*Math.cos(f.yaw)+n[2]*Math.sin(f.yaw))/length,ny=n[1]/length,nz=(n[2]*Math.cos(f.yaw)-n[0]*Math.sin(f.yaw))/length;
  // Gentle occlusion where the seat tucks into the back; the crown remains unchanged.
  const recess=kind==='seat'?.08*Math.max(0,(p[2]/half[2]-.4)/.6):0;
  return {...projected(p),shade:.78+.24*ny-.14*nx-.1*nz-recess};
 };
 const triangles:SofaTriangle[]=[];
 const rows=32,columns=64;
 // Project each shared grid vertex once, rather than four times per cell.
 const grid=Array.from({length:rows+1},(_,row)=>Array.from({length:columns+1},(_,col)=>vertex(-Math.PI/2+row*Math.PI/rows,col*Math.PI*2/columns)));
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const p=grid[row][col],q=grid[row][col+1],r=grid[row+1][col+1],t=grid[row+1][col];
  triangles.push([p,q,r],[p,r,t]);
 }
 // A restrained dark crease follows the rounded surface; no contrasting piping.
 const seam=Array.from({length:97},(_,i)=>{
  const a=i/96*Math.PI*2;
  if(kind==='back')return [half[0]*.91*power(Math.cos(a),.43),half[1]*.86*power(Math.sin(a),.43),-half[2]*.91];
  return surface(kind==='seat'?.1:kind==='arm'?.35:-.25,a);
 });
 return <g pointerEvents="none">
  <SofaSmoothSurface triangles={triangles}/>
  <path d={path(seam)} fill="none" stroke="#293722" strokeWidth=".5" strokeOpacity=".2"/>
  {(kind==='back'||kind==='seat')&&[-1,1].map((sign)=><g key={sign}>{[0,1].map(i=>{
   const pts=kind==='back'?[[sign*w*.39,-h*.29,-d*.46],[sign*w*(.34-i*.02),-h*.21,-d*.49],[sign*w*.3,-h*.14,-d*.5]]:[[sign*w*.39,h*.24,-d*.4],[sign*w*.33,h*.35,-d*.32],[sign*w*(.28-i*.03),h*.42,-d*.25]];
   return <path key={i} d={path(pts).replace(/Z$/,'')} fill="none" stroke="#293922" strokeWidth=".65" strokeOpacity=".4" strokeLinecap="round"/>;
  })}</g>)}
 </g>;
},(a,b)=>a.config===b.config&&a.view===b.view&&a.kind===b.kind&&
 a.x===b.x&&a.y===b.y&&a.z===b.z&&a.w===b.w&&a.h===b.h&&a.d===b.d&&
 a.fixture.x===b.fixture.x&&a.fixture.y===b.fixture.y&&a.fixture.z===b.fixture.z&&
 a.fixture.scale===b.fixture.scale&&a.fixture.yaw===b.fixture.yaw);
