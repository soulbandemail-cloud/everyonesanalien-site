import { useId } from 'react';
import { PLANET_INK, REAL_HEART_PATH } from '@/lib/ship/wordmarkGeometry';

// Keep the old outer ellipse; broaden inward toward the viewer, taper on the far side.
function ringRibbon(front:boolean) {
 const start=front?0:Math.PI;
 const edge=(inner:boolean)=>Array.from({length:97},(_,i)=>{
  const t=start+i*Math.PI/96,c=Math.cos(t),s=Math.sin(t),n=Math.hypot(c/88,s/25);
  const width=9+3*s,offset=inner?4.5-width:4.5;
  return `${(88*c+offset*c/88/n).toFixed(4)},${(25*s+offset*s/25/n).toFixed(4)}`;
 });
 return `M${edge(false).join('L')}L${edge(true).reverse().join('L')}Z`;
}

// Authored continental shelves, refined at three nested coastal scales.
// Computed once, with no random source, texture animation or per-frame work.
function coastline(path:string, phase:number) {
 const n=path.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
 let x=n[0],y=n[1];const points:{x:number;y:number}[]=[];
 for(let k=2;k<n.length;k+=6){
  const [ax,ay,bx,by,cx,cy]=n.slice(k,k+6);
  for(let i=0;i<24;i++){
   const t=i/24,u=1-t;
   const px=u*u*u*x+3*u*u*t*ax+3*u*t*t*bx+t*t*t*cx;
   const py=u*u*u*y+3*u*u*t*ay+3*u*t*t*by+t*t*t*cy;
   const dx=3*u*u*(ax-x)+6*u*t*(bx-ax)+3*t*t*(cx-bx);
   const dy=3*u*u*(ay-y)+6*u*t*(by-ay)+3*t*t*(cy-by);
   const a=((k-2)/6+t)*2.7+phase;
   const relief=.85*Math.sin(a*3)+.38*Math.sin(a*7.3+1)+.16*Math.sin(a*17.1);
   const length=Math.hypot(dx,dy)||1;
   points.push({x:px-dy/length*relief,y:py+dx/length*relief});
  }
  x=cx;y=cy;
 }
 const f=(v:number)=>v.toFixed(2),mid=(a:typeof points[number],b:typeof a)=>`${f((a.x+b.x)/2)} ${f((a.y+b.y)/2)}`;
 return `M${mid(points.at(-1)!,points[0])}`+points.map((p,i)=>`Q${f(p.x)} ${f(p.y)} ${mid(p,points[(i+1)%points.length])}`).join('')+'Z';
}
const continents=[
 'M-50-28 C-45-37-37-40-31-38 C-27-36-26-40-22-37 C-19-34-26-32-23-29 C-21-27-17-30-15-26 C-14-23-22-23-20-20 C-18-17-11-20-11-15 C-11-11-17-12-18-9 C-20-5-23-7-25-11 C-28-15-34-12-32-9 C-29-5-32-1-35-2 C-38-2-35 3-39 5 C-44 7-45 0-48 1 C-52 0-53-16-50-28Z',
 'M4-42 C12-45 17-40 22-42 C27-45 36-40 38-34 C40-31 33-32 31-29 C28-25 36-27 36-23 C36-20 28-21 27-18 C26-15 32-14 30-11 C28-8 22-12 20-8 C18-5 25-3 21 0 C18 3 15-2 12 1 C10 4 13 8 8 9 C3 9 3 3 0 4 C-4 6-9 1-6-3 C-3-7 3-5 4-9 C5-13-3-11-5-15 C-8-19-1-21 2-19 C7-17 8-23 4-24 C0-25-5-29-1-32 C4-35 0-39 4-42Z',
 'M-25 10 C-20 6-15 10-12 8 C-8 6-6 13-2 12 C3 9 7 13 7 17 C7 20 2 20 4 23 C5 26 12 25 12 30 C11 34 6 30 5 34 C3 38 6 42 1 46 C-3 49-6 40-9 39 C-13 38-10 32-15 32 C-20 32-21 28-17 26 C-13 23-18 20-22 22 C-27 22-22 17-25 15 C-28 14-29 12-25 10Z',
 'M36 8 C40 5 45 8 48 5 C52 10 46 17 43 19 C40 21 43 24 38 26 C33 28 35 33 30 33 C25 33 22 29 25 26 C29 24 32 26 32 22 C32 19 26 20 27 16 C28 12 32 15 34 12 C36 11 33 10 36 8Z'
].map((path,i)=>coastline(path,i*2.1));

/** The existing exterior planet, now the single O in the live projected wordmark. */
export default function RealPlanetHeart() {
 const id=useId();
 const surfaceId=`${id}-surface`,shadeId=`${id}-shade`;
 const ringGlowId=`${id}-ring-glow`;
 return <span className="soul-planet" data-world-object="planet-heart" aria-hidden="true">
  <svg className="real-planet-heart" viewBox={`${PLANET_INK.left} ${PLANET_INK.top} ${PLANET_INK.right-PLANET_INK.left} ${PLANET_INK.bottom-PLANET_INK.top}`}>
   <defs>
    <clipPath id={surfaceId}><path d={REAL_HEART_PATH}/></clipPath>
    <radialGradient id={id} cx="30%" cy="22%" r="90%"><stop stopColor="#16C7C5"/><stop offset=".48" stopColor="#008F9C"/><stop offset="1" stopColor="#006C83"/></radialGradient>
    <linearGradient id={shadeId} x1="0" y1="0" x2="1" y2=".7"><stop stopColor="#e1fff3" stopOpacity=".16"/><stop offset=".5" stopColor="#e1fff3" stopOpacity="0"/><stop offset="1" stopColor="#005D83" stopOpacity=".16"/></linearGradient>
    <linearGradient id={`${id}-land`} x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#A5F5A1"/><stop offset=".55" stopColor="#6EE7A0"/><stop offset="1" stopColor="#31C98B"/></linearGradient>
    {/* Explicit user-space bounds cover both ring halves and their widest halo. */}
    <filter id={ringGlowId} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x="-200" y="-150" width="400" height="300" colorInterpolationFilters="sRGB">
     <feGaussianBlur in="SourceAlpha" stdDeviation="14" result="near-blur" />
     <feFlood floodColor="rgb(255,176,255)" floodOpacity=".90" result="near-pink" />
     <feComposite in="near-pink" in2="near-blur" operator="in" result="near-halo" />
     <feGaussianBlur in="SourceAlpha" stdDeviation="24" result="middle-blur" />
     <feFlood floodColor="rgb(255,176,255)" floodOpacity=".65" result="middle-pink" />
     <feComposite in="middle-pink" in2="middle-blur" operator="in" result="middle-halo" />
     <feGaussianBlur in="SourceAlpha" stdDeviation="40" result="outer-blur" />
     <feFlood floodColor="rgb(255,176,255)" floodOpacity=".32" result="outer-pink" />
     <feComposite in="outer-pink" in2="outer-blur" operator="in" result="outer-halo" />
     <feMerge>
      <feMergeNode in="outer-halo" /><feMergeNode in="middle-halo" /><feMergeNode in="near-halo" />
      <feMergeNode in="SourceGraphic" />
     </feMerge>
    </filter>
   </defs>
   <g transform="rotate(-18)">
    <path data-ring="rear" d={ringRibbon(false)} fill="white" className="planet-letter-ring" filter={`url(#${ringGlowId})`} />
   </g>
   <path d={REAL_HEART_PATH} fill={`url(#${id})`} stroke="#43DCD1" strokeWidth=".6"/>
   <g clipPath={`url(#${surfaceId})`}>
    {/* Continuous land with nested coves, headlands and coastal fragmentation. */}
    <g fill={`url(#${id}-land)`}>
     {continents.map((d,i)=><path key={i} d={d}/>)}
     <path d="M-5-35q4-5 5 1l-2 4-3-1Z M17 9q4-5 6 0l-2 4-4-1Z M-34 15l3-3 2 3-3 4Z M14 16q3-3 3 1l-2 2Z"/>
     <path d="M-31 4l2-2 1 3-2 2Z M-28 7l2-1 1 2-2 1Z M-26 10l1-2 2 1-1 2Z M-21-6l3-2 1 3-2 2Z M-16-6l2-1 1 2-2 1Z M23-5l2-2 2 2-3 2Z M26 0l3-1 1 2-3 1Z M27 5l2-1 1 2-2 1Z M16 30l3-2 2 2-2 2Z M18 35l2-1 1 2-2 1Z M-23 27l2-2 1 2-2 2Z"/>
    </g>
    {/* Sunlit terrain and saturated inland channels, without dark coastal outlines. */}
    <g fill="#D5F5A0" opacity=".30">
     <path d="M-44-31 C-36-37-29-34-31-30 C-33-26-23-28-24-24 C-28-19-37-25-39-17 C-43-14-44-24-44-31Z"/>
     <path d="M10-35 C17-39 28-35 26-31 C22-27 13-31 15-23 C18-16 9-13 7-17 C5-21 10-24 7-27 C4-30 7-33 10-35Z"/>
     <path d="M-17 13 C-12 11-10 19-5 18 C1 15 3 21-1 25 C-6 28-7 22-12 24 C-18 25-12 18-17 13Z"/>
    </g>
    <g fill="#008F9C" opacity=".55">
     <path d="M-45 9 C-36 3-31 7-30 11 C-33 7-41 10-45 16Z M-8-14 C-3-17 2-13 0-10 C-1-13-5-11-8-14Z M9 35 C17 33 23 30 27 25 C24 33 16 38 9 40Z"/>
     <path d="M18-29 C22-31 24-27 21-25 C18-24 20-27 18-29Z M-19-28 C-17-30-15-26-17-25Z"/>
    </g>
    <g fill="none" stroke="#16C7C5" strokeLinecap="round" opacity=".30">
     <path d="M-46-10Q-35-22-19-16T11-12 M-33 29Q-20 18-4 24T28 13" strokeWidth="1.3"/>
     <path d="M-41-8Q-29-19-17-14 M-27 32Q-18 23-8 27 M32-28Q44-18 43-8" strokeWidth=".55"/>
    </g>
    {/* Layered weather: translucent skirts, brighter curled cores and tapered filaments. */}
    <g fill="#F5FFF4" opacity=".38">
     <path d="M-53-13 C-46-31-31-35-23-28 C-17-24-17-15-25-14 C-17-20-27-30-38-23 C-45-19-49-15-53-13Z"/>
     <path d="M11-22 C23-31 40-20 43-7 C46 7 33 13 30 23 C29 11 39 5 38-5 C38-19 24-24 11-22Z"/>
     <path d="M-28 29 C-15 19-5 27 5 25 C20 24 18 18 28 16 C21 22 23 30 7 34 C-8 38-14 24-28 29Z"/>
    </g>
    <g fill="#F5FFF4" opacity=".88">
     <path d="M-51-17 C-43-30-31-33-24-28 C-18-25-18-19-22-17 C-25-15-30-18-28-21 C-27-17-22-20-24-23 C-28-29-38-24-42-21 C-38-25-34-27-32-27 C-42-26-46-19-51-17Z"/>
     <path d="M-21-37 C-11-43-6-35 2-34 C11-30 18-34 17-38 C20-36 19-32 14-30 C8-27 0-29-4-32 C0-29 1-26 6-26 C-4-26-6-35-13-35 C-17-36-18-36-21-37Z"/>
     <path d="M13-19 C25-27 38-17 39-7 C40 2 35 5 32 11 C32 4 36 0 35-5 C34-1 31 2 27 2 C32-1 33-8 30-12 C27-17 19-16 20-11 C21-8 25-9 26-12 C28-6 20-4 17-9 C13-16 22-21 28-17 C24-21 19-22 13-19Z"/>
     <path d="M-44 2 C-34-6-26-4-19 2 C-12 7-6 8 0 5 C-5 10-12 10-18 6 C-21 5-25 2-28 1 C-24 4-26 6-22 8 C-28 7-29 1-34 1 C-39 1-41 1-44 2Z"/>
     <path d="M-24 28 C-13 20-6 30 5 29 C16 28 20 20 26 20 C20 24 21 28 15 31 C9 35 2 33-3 32 C0 35 6 36 11 35 C4 40-4 34-8 31 C-14 27-19 27-24 28Z"/>
    </g>
    <g fill="#F5FFF4" opacity=".68">
     <path d="M-47-9 C-39-17-35-14-32-16 C-36-10-41-14-47-9Z M-36-34 C-30-39-23-34-20-30 C-25-33-28-35-36-34Z"/>
     <path d="M24-30 C31-29 39-22 40-16 C35-22 31-27 24-30Z M42-1 C45 8 39 18 34 21 C38 14 43 10 42-1Z"/>
     <path d="M-31 8 C-24 12-14 9-8 15 C-18 11-23 15-31 8Z M-15 36 C-7 36-5 42 1 43 C-6 45-10 38-15 36Z M11 22 C16 23 20 17 24 16 C21 21 16 25 11 22Z"/>
    </g>
    {/* Long weather fronts divide into fine swept feathers and secondary curls. */}
    <g fill="#C7FFF3" opacity=".38">
     <path d="M-49-20C-32-43-12-32-21-18C-26-9-38-19-30-24C-34-17-25-15-24-22C-22-34-40-30-49-20Z"/>
     <path d="M4-34C18-46 40-41 46-25C38-34 29-32 27-28C25-23 29-20 32-22C34-26 28-27 29-23C24-27 32-30 35-25C41-14 21-14 23-28C23-36 12-36 4-34Z"/>
    </g>
    <g fill="#F5FFF4" opacity=".95">
     <path d="M5-36C20-46 37-39 43-29C36-35 24-36 24-28C24-22 29-19 33-23C36-28 28-30 29-25C27-30 34-31 36-26C40-18 28-15 23-21C15-30 26-37 31-36C20-41 11-35 5-36Z"/>
     <path d="M-41 13C-34 4-24 7-24 14C-24 19-30 21-33 17C-36 12-30 10-29 14C-32 12-33 16-30 17C-26 18-25 11-31 10C-35 10-38 13-41 13Z"/>
     <path d="M-7 43C4 42 16 33 20 27C18 35 9 41 3 44L0 48Z"/>
    </g>
    <g fill="none" stroke="#F5FFF4" strokeLinecap="round">
     <path d="M-47-14C-40-22-35-20-31-23 M-43-11C-37-16-30-12-26-15 M-39-8C-31-13-23-8-20-17 M-18-30C-10-25-10-19-3-20 M-16-28C-11-22-14-19-8-17 M-7-32Q2-25 10-29 M29-35Q39-30 43-22 M35-31Q44-24 45-15 M37-14C45-2 37 7 35 14 M35 3Q29 10 29 16 M31 11Q26 16 27 20 M-34 4Q-22 2-16 11 M-26 4Q-19 10-12 10 M-19 7Q-15 14-8 13 M-20 25Q-10 22-3 28 M-12 26Q-3 34 8 31 M-5 33Q5 39 14 34" strokeWidth=".65" opacity=".82"/>
     <path d="M-42-29Q-36-34-29-32 M-38-32Q-31-38-25-33 M10-39Q20-44 26-41 M33-34Q40-33 44-26 M-38 17Q-34 22-28 22 M-25 18Q-19 17-16 22 M13 33Q22 28 24 23 M17 35Q25 29 27 25" strokeWidth=".35" opacity=".62"/>
    </g>
    <path d={REAL_HEART_PATH} fill={`url(#${shadeId})`}/>
    {/* Clipped inward: a delicate atmospheric edge never enlarges the silhouette. */}
    <path d={REAL_HEART_PATH} fill="none" stroke="#7BFFE1" strokeWidth="1.3" opacity=".52"/>
    <path d={REAL_HEART_PATH} fill="none" stroke="#D5FFF0" strokeWidth=".35" opacity=".6"/>
   </g>
   <g transform="rotate(-18)"><path data-ring="front" d={ringRibbon(true)} fill="white" className="planet-letter-ring" filter={`url(#${ringGlowId})`} /></g>
  </svg>
 </span>;
}
