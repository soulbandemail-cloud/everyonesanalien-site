'use client';
import {useId,useSyncExternalStore,type ReactNode} from 'react';
import {blades,createBattle,head,shoulder} from '../arcade/polemanBattle';
import './telescopeDiscoveries.css';

// Existing save key and notification, shared with the arcade reward system.
function subscribe(notify:()=>void){window.addEventListener('poleman-reward',notify);window.addEventListener('storage',notify);return()=>{window.removeEventListener('poleman-reward',notify);window.removeEventListener('storage',notify);};}
function defeated(){try{return localStorage.getItem('bossDefeated')==='true';}catch{return false;}}
// One position per page load; reopening the telescope keeps this visit's orbit point.
let visitAngle:number|undefined;
const orbitSnapshot=()=>visitAngle??(visitAngle=Math.random()*Math.PI*2);
const subscribeOrbit=()=>()=>{};
const serverOrbit=()=>-1;
const blurAt=(focus:number,depth:number)=>Math.min(8,Math.max(0,Math.abs(focus-depth)-3)*.18);
// Deterministic, batched dust knots along logarithmic spiral arms. No new stars
// are added to the existing starfield; these points belong to the galaxy only.
const dust=Array.from({length:4},(_,arm)=>{
 let d='';for(let i=0;i<190;i++){
  const u=i/189,r=3+u*43,a=arm*Math.PI/2+u*5.8;
  const jitter=Math.sin(i*73.17+arm*19.3)*2.1*u;
  const x=(r+jitter)*Math.cos(a),y=(r+jitter)*Math.sin(a);
  const size=.12+(.5+.5*Math.sin(i*17.3))*.38;
  d+=`M${x.toFixed(3)} ${y.toFixed(3)}h${size.toFixed(3)}v${size.toFixed(3)}h-${size.toFixed(3)}z`;
 }return d;
});
const spiral=Array.from({length:4},(_,arm)=>Array.from({length:100},(_,i)=>{
 const u=i/99,r=3+u*43,a=arm*Math.PI/2+u*5.8;return `${i?'L':'M'}${(r*Math.cos(a)).toFixed(3)} ${(r*Math.sin(a)).toFixed(3)}`;
}).join(''));
const pose=createBattle(700);pose.phase='recovery';pose.time=0;
const origin=shoulder(pose),tip=head(pose),arms=blades(pose);

function Station(){
 return <g transform="rotate(9)" strokeLinejoin="round">
  {/* Six-times-body-height lattice, with two visible structural faces. */}
  <path d="M-4 0L-.6 -34H.6L4 0Z" fill="#333d49" stroke="#c1bdb2" strokeWidth=".42"/>
  <path d="M0 0V-34M-3.7 -3L3.3 -7L-2.9 -11L2.4 -15L-2 -19L1.6 -23L-1.2 -27L.7 -31M3.7 -3L-3.3 -7L2.9 -11L-2.4 -15L2 -19L-1.6 -23L1.2 -27L-.7 -31" fill="none" stroke="#b0b4b5" strokeWidth=".3"/>
  {[-7,-15,-23,-31].map((y,i)=><path key={y} d={`M${-3.4+i*.8} ${y}h${6.8-i*1.6}`} stroke="#d1c7ae" strokeWidth=".45"/>)}
  <path d="M0 -34V-40M-1 -32V-36M1 -32V-37" stroke="#d3d3ce" strokeWidth=".35"/>
  <path d="M-5 3H-19M5 3H19" stroke="#b7b2a3" strokeWidth=".6"/>
  {[-1,1].map(side=><g key={side} transform={`scale(${side} 1)`}>
   <path d="M6 0H20V7H6Z" fill="#19355d" stroke="#afb6bd" strokeWidth=".4"/>
   <path d="M8 0V7M10 0V7M12 0V7M14 0V7M16 0V7M18 0V7M6 2.3H20M6 4.7H20" stroke="#7a91ae" strokeWidth=".17"/>
  </g>)}
  <path d="M-4 0L4 0L5 1V6L-3 6L-4 5Z" fill="#92958f" stroke="#d1c9b5" strokeWidth=".35"/>
  <path d="M-4 0L-3 1V6M-3 1H5" fill="none" stroke="#414f5a" strokeWidth=".5"/>
  <path d="M-2 2H-.5V3.5H-2ZM1 2H2.5V3.5H1Z" fill="#ffd890"/>
  <path d="M-2 5H2M0 6V8M-1.5 8H1.5" stroke="#c9c6b6" strokeWidth=".5"/>
  <path d="M-4 -2Q-7 -5-5 -6Q-2 -6-4 -2M3 -5Q6 -8 6 -4Q4 -2 3 -5" fill="#a6adae" stroke="#e0dcd0" strokeWidth=".25"/>
  {[[-.1,-40],[-2,-19],[2,-19],[-3.7,-3]].map(([x,y],i)=><g key={i} className={`soul-station-beacon beacon-${i}`}><circle cx={x} cy={y} r=".75" fill="#ff403b" opacity=".22"/><circle cx={x} cy={y} r=".3" fill="#ff6a55"/></g>)}
 </g>;
}
export function TelescopeDiscoveries({focus,planetX,planetY,children}:{focus:number;planetX:number;planetY:number;children:ReactNode}){
 const id=`discoveries-${useId().replace(/:/g,'')}`;
 const gone=useSyncExternalStore(subscribe,defeated,()=>true);
 const angle=useSyncExternalStore(subscribeOrbit,orbitSnapshot,serverOrbit);
 const inFront=Math.sin(angle)>=0;
 const satellite=(front:boolean)=>angle<0||front!==inFront?null:<g transform={`translate(${planetX} ${planetY}) rotate(-18)`} pointerEvents="none" data-celestial="station" data-focus-depth="3">
  <g transform={`translate(${82*Math.cos(angle)} ${28*Math.sin(angle)})`}>
   <g filter={`url(#${id}-station-focus)`}>
    <g transform="rotate(18)"><use href={`#${id}-station`}/></g>
   </g>
  </g>
 </g>;
 return <>
  <defs>
   <g id={`${id}-station`}><Station/></g>
   <filter id={`${id}-station-focus`} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation={blurAt(focus,3)}/></filter>
   <filter id={`${id}-galaxy-focus`} x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation={blurAt(focus,100)}/></filter>
   <filter id={`${id}-poleman-focus`} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation={blurAt(focus,64)}/></filter>
   <radialGradient id={`${id}-core`}><stop stopColor="#ffffec" stopOpacity=".92"/><stop offset=".2" stopColor="#d8d8f3" stopOpacity=".6"/><stop offset=".55" stopColor="#8f98ca" stopOpacity=".16"/><stop offset="1" stopColor="#7c83bc" stopOpacity="0"/></radialGradient>
   <filter id={`${id}-haze`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.7"/></filter>
  </defs>
  <g transform="translate(465 465) rotate(-27)" pointerEvents="none" data-celestial="galaxy" data-focus-depth="100">
   <g filter={`url(#${id}-galaxy-focus)`}><g transform="scale(1 .58)">
    <ellipse rx="55" ry="48" fill={`url(#${id}-core)`} opacity=".5"/>
    <g fill="none" strokeLinecap="round" filter={`url(#${id}-haze)`}>{spiral.map((d,i)=><path key={i} d={d} stroke={i%2?'#afa2d4':'#9ebbe1'} strokeWidth="3.8" opacity=".27"/>)}</g>
    {dust.map((d,i)=><path key={i} d={d} fill={i%2?'#d2c5e9':'#dae9ff'} opacity=".65"/>)}
    <ellipse rx="19" ry="16" fill={`url(#${id}-core)`}/>
    <ellipse rx="3" ry="2.6" fill="#f3eddd" opacity=".6" filter={`url(#${id}-haze)`}/>
   </g></g>
  </g>
  {!gone&&<g transform="translate(1040 680)" pointerEvents="none" data-celestial="poleman" data-focus-depth="64"><g filter={`url(#${id}-poleman-focus)`}><g transform="scale(.01125) translate(-500 -350)" opacity=".66">
   <path d={`M${origin.x} ${origin.y}V700`} stroke="#d5d6cb" strokeWidth="8"/>
   {arms.map((arm,i)=><path key={i} d={`M${origin.x} ${origin.y}L${arm.joint.x} ${arm.joint.y}L${arm.a.x} ${arm.a.y}L${arm.b.x} ${arm.b.y}`} stroke="#d5d6cb" strokeWidth="7" fill="none"/>)}
   <g opacity=".45">
   <path d={`M492 350L${tip.x-11*tip.scale} ${tip.y}H${tip.x+11*tip.scale}L508 350Z`} fill="#d5d6cb"/>
   <ellipse cx={tip.x} cy={tip.y} rx={tip.r+4} ry={tip.r*.7+4} fill="#d5d6cb"/>
   <ellipse cx={tip.x} cy={tip.y} rx={tip.r} ry={tip.r*.7} fill="#020406"/>
   </g>
  </g></g></g>}
  {satellite(false)}
  {children}
  {satellite(true)}
 </>;
}
