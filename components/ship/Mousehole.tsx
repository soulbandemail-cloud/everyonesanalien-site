import {useEffect,useId,useRef} from 'react';
import {project,type DomeConfig,type Viewport} from '@/lib/ship/domeGeometry';
import {platformY,polygonPath} from '@/lib/ship/roomGeometry';

/** Permanent opening at the outer end of the right-hand stage parapet. */
export function mouseholeGeometry(config:DomeConfig,view:Viewport){
 const theta=3.6*Math.PI*2/40,width=.28,height=.34;
 const point=(x:number,y:number,depth=0)=>{const a=theta+x/config.radius;return {x:config.centre.x+(config.radius+depth)*Math.sin(a),y:platformY+y,z:config.centre.z+(config.radius+depth)*Math.cos(a)};};
 const arch=(inset=0,depth=0)=>{
  const r=width/2-inset,h=height-inset;
  return polygonPath([point(-r,0,depth),point(-r,h-r,depth),...Array.from({length:25},(_,i)=>{const a=Math.PI-i*Math.PI/24;return point(r*Math.cos(a),h-r+r*Math.sin(a),depth);}),point(r,0,depth)],config,view);
 };
 const o=project(point(0,0),config,view),x=project(point(width,0),config,view),y=project(point(0,height),config,view);
 return {opening:arch(),inner:arch(.025,.075),matrix:`matrix(${(x.x-o.x)/100} ${(x.y-o.y)/100} ${(o.x-y.x)/110} ${(o.y-y.y)/110} ${o.x} ${o.y})`};
}
export function Mousehole({config,view,active}:{config:DomeConfig;view:Viewport;active:boolean}){
 const id=useId(),mouse=useRef<SVGGElement>(null),head=useRef<SVGGElement>(null),left=useRef<SVGGElement>(null),right=useRef<SVGGElement>(null),nose=useRef<SVGEllipseElement>(null);
 const shape=mouseholeGeometry(config,view);
 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>|undefined,frame=0;
  const hide=()=>{if(mouse.current)mouse.current.style.opacity='0';};
  const stop=()=>{clearTimeout(timer);cancelAnimationFrame(frame);hide();};
  const schedule=()=>{if(active&&!document.hidden)timer=setTimeout(appear,30000+Math.random()*60000);};
  const appear=()=>{
   if(!active||document.hidden)return;
   const start=performance.now(),hold=3+Math.random()*3,side=Math.random()<.5?-1:1,both=Math.random()<.4;
   const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   let last=0;
   const smooth=(v:number)=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
   const tick=(now:number)=>{
    const t=(now-start)/1000,emerge=smooth(t/.95),retreat=smooth((t-hold-.95)/.24),presence=emerge*(1-retreat);
    if(t>hold+1.2){hide();schedule();return;}
    if(now-last>1000/30){
     last=now;
     mouse.current?.setAttribute('transform',`translate(0 ${(1-presence)*24})`);
     if(mouse.current)mouse.current.style.opacity=String(presence);
     const look=reduced?0:side*(smooth((t-1.35)/.6)-(both?2*smooth((t-2.7)/.7):0))*(1-retreat);
     head.current?.setAttribute('transform',`translate(${look*3} 0) rotate(${look*7} 0 -36)`);
     const twitch=reduced?0:Math.sin(t*42)*Math.pow(Math.max(0,Math.sin(t*4.7)),8)*5;
     left.current?.setAttribute('transform',`rotate(${twitch} -9 -27)`);
     right.current?.setAttribute('transform',`rotate(${-twitch*.8} 9 -27)`);
     nose.current?.setAttribute('cy',String(-26+(reduced?0:Math.sin(t*13)*.65)));
    }
    frame=requestAnimationFrame(tick);
   };frame=requestAnimationFrame(tick);
  };
  const visibility=()=>{stop();schedule();};
  hide();schedule();document.addEventListener('visibilitychange',visibility);
  return()=>{stop();document.removeEventListener('visibilitychange',visibility);};
 },[active]);
 return <g pointerEvents="none" aria-hidden="true" data-mousehole>
  <defs>
   <clipPath id={`${id}-opening`}><path d={shape.opening}/></clipPath>
   <radialGradient id={`${id}-dark`} cx="70%" cy="95%" r="90%"><stop stopColor="#29251f"/><stop offset="1" stopColor="#090d0e"/></radialGradient>
   <radialGradient id={`${id}-fur`} cx="38%" cy="25%"><stop stopColor="#c19a66"/><stop offset=".6" stopColor="#987046"/><stop offset="1" stopColor="#62492f"/></radialGradient>
  </defs>
  <path d={shape.opening} fill="#493e32" stroke="#b0a087" strokeWidth=".6"/>
  <path d={shape.inner} fill={`url(#${id}-dark)`}/>
  <g clipPath={`url(#${id}-opening)`}>
   <g transform={shape.matrix}>
    <g ref={mouse} style={{opacity:0}}>
     {/* Only the toes and head emerge; there is no external body or tail. */}
     <ellipse cx="-17" cy="-3" rx="9" ry="4" fill="#b39171"/><ellipse cx="17" cy="-3" rx="9" ry="4" fill="#b39171"/>
     <path d="M-20 -5v4m5-4v4m29-4v4m5-4v4" stroke="#70523e" strokeWidth="1.1"/>
     <g ref={head}>
      <ellipse cx="-24" cy="-65" rx="15" ry="19" fill="#785537" stroke="#3c3027" strokeWidth="2"/>
      <ellipse cx="24" cy="-65" rx="15" ry="19" fill="#785537" stroke="#3c3027" strokeWidth="2"/>
      <ellipse cx="-24" cy="-65" rx="10" ry="13" fill="#bb8a78"/><ellipse cx="24" cy="-65" rx="10" ry="13" fill="#bb8a78"/>
      <path d="M-28 -48Q-24 -72 0 -69Q24 -72 28 -48Q29 -28 9 -17Q0 -12-9 -17Q-29 -28-28 -48Z" fill={`url(#${id}-fur)`}/>
      <ellipse cx="-13" cy="-43" rx="4" ry="5" fill="#171715"/><ellipse cx="13" cy="-43" rx="4" ry="5" fill="#171715"/>
      <circle cx="-14" cy="-45" r="1.2" fill="#eee1c3"/><circle cx="12" cy="-45" r="1.2" fill="#eee1c3"/>
      <ellipse cx="-7" cy="-25" rx="10" ry="8" fill="#d6bd94"/><ellipse cx="7" cy="-25" rx="10" ry="8" fill="#d6bd94"/>
      <ellipse ref={nose} cx="0" cy="-26" rx="4.5" ry="3" fill="#ce928b"/>
      <path d="M0 -23v4m-4 0q4 3 8 0" fill="none" stroke="#6c4939" strokeWidth="1"/>
      <g ref={left} stroke="#cfbea1" strokeWidth=".9" fill="none"><path d="M-9 -27Q-27 -36-43 -32M-9 -25L-44 -24M-9 -23Q-27 -21-39 -16"/></g>
      <g ref={right} stroke="#cfbea1" strokeWidth=".9" fill="none"><path d="M9 -27Q27 -36 43 -32M9 -25L44 -24M9 -23Q27 -21 39 -16"/></g>
     </g>
    </g>
   </g>
  </g>
 </g>;
}
