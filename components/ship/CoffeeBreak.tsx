import {useEffect,useId,useLayoutEffect,useRef,type RefObject} from 'react';
import {project,type DomeConfig,type Viewport} from '@/lib/ship/domeGeometry';
import {orientedFixtures} from '@/lib/ship/fixtureLayout';
import {localPoint} from '@/lib/ship/charlieNavigation';
import {ROOM} from '@/lib/ship/roomGeometry';
import {coffeeEase,coffeePhase,type CoffeePose} from '@/lib/ship/coffee';
import type {CharlieState} from './useCharlieMovement';
export function CoffeeBreak({state,config,view,pose}:{state:CharlieState;config:DomeConfig;view:Viewport;pose:RefObject<CoffeePose|undefined>}){
 const layer=useRef<SVGSVGElement>(null);
 const id=useId(),mug=useRef<SVGGElement>(null),steam=useRef<SVGGElement>(null);
 const target=useRef({state,config,view});
 useLayoutEffect(()=>{target.current={state,config,view};},[state,config,view]);
 useEffect(()=>{
  let frame=0,last=0,time=0,wait=10+Math.random()*10,elapsed=-1,cancel=0;
  let current:{x:number;y:number;s:number;angle:number}|undefined,returnFrom:typeof current;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const interrupt=()=>{if(elapsed>=0){cancel=.001;returnFrom=current;elapsed=-1;pose.current=undefined;}wait=10+Math.random()*10;};
  window.addEventListener('pointerdown',interrupt,true);
  window.addEventListener('keydown',interrupt,true);
  const draw=(now:number)=>{
   frame=requestAnimationFrame(draw);const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
   if(document.hidden)return;time+=dt;
   const {state:s,config:c,view:v}=target.current;
   const table=orientedFixtures(c.centre,c.radius).coffeeTable;
   const rest=project({...localPoint(table,.56,.12),y:table.y+.56*table.scale},c,v);
   const scale=rest.scale*.008;
   const home={x:rest.x,y:rest.y,s:scale,angle:0};
   const eligible=s.mode==='sofa-seated'&&!s.phase&&s.paper>.99&&s.engagement==='newsletter'&&!s.moving;
   if(!eligible||reduced.matches){if(elapsed>=0)interrupt();else wait=10+Math.random()*10;}
   else if(elapsed<0&&!cancel){wait-=dt;if(wait<=0)elapsed=0;}
   let point=home,behindPaper=false;
   if(elapsed>=0){
    elapsed+=dt;const f=coffeePhase(elapsed),p=project(s.position,c,v),w=ROOM.alienWidth*p.scale,h=ROOM.alienHeight*p.scale,a=s.yaw*Math.PI/180;
    // Mouth target follows the same illustrated rig and projection as Charlie.
    const mouthX=6*Math.cos(a)-43*Math.sin(a),mouthY=105;
    const mouth={x:p.x+mouthX*w/180,y:p.y-h+mouthY*h/250};
    const angle=-12*f.sip,tilt=angle*Math.PI/180;
    // The prop origin is its base; bring the rim, not the base, to his lips.
    const sipX=mouth.x-23*scale*Math.sin(tilt),sipY=mouth.y+23*scale*Math.cos(tilt);
    point={x:home.x+(sipX-home.x)*f.lift,y:home.y+(sipY-home.y)*f.lift-8*scale*Math.sin(Math.PI*f.lift),s:scale,angle};
    behindPaper=f.lift>0&&f.lift<.96;
    const handScreenX=point.x-17*scale,handScreenY=point.y-10*scale;
    const x=(handScreenX-p.x)*180/w,y=(handScreenY-p.y+h)*250/h,depth=-25;
    pose.current={lower:f.lower,reach:f.reach,lean:f.lean,hand:{x:x*Math.cos(a)-depth*Math.sin(a),y,z:x*Math.sin(a)+depth*Math.cos(a)}};
    if(elapsed>=8){elapsed=-1;pose.current=undefined;wait=10+Math.random()*10;point=home;}
   }
   if(cancel&&returnFrom){cancel+=dt;const t=coffeeEase(cancel/.55);point={x:returnFrom.x+(home.x-returnFrom.x)*t,y:returnFrom.y+(home.y-returnFrom.y)*t,s:scale,angle:returnFrom.angle*(1-t)};if(t===1){cancel=0;returnFrom=undefined;}}
   if(layer.current)layer.current.style.zIndex=behindPaper?'7':'9';
   current=point;
   mug.current?.setAttribute('transform',`translate(${point.x} ${point.y}) scale(${point.s}) rotate(${point.angle})`);
   steam.current?.setAttribute('transform',`translate(${point.x} ${point.y-23*point.s}) scale(${point.s})`);
   steam.current?.querySelectorAll('path').forEach((el,i)=>{
    const t=reduced.matches?.4:(time*(.19+i*.017)+i*.31)%1;
    el.setAttribute('d',`M${-6+i*6} ${-t*22}q${Math.sin(time*.6+i)*5} -9 1 -17t-2 -14`);
    el.setAttribute('opacity',String((1-t)*.45));
   });
  };
  frame=requestAnimationFrame(draw);
  return()=>{cancelAnimationFrame(frame);pose.current=undefined;window.removeEventListener('pointerdown',interrupt,true);window.removeEventListener('keydown',interrupt,true);};
 },[pose]);
 return <svg ref={layer} width={view.width} height={view.height} style={{position:'absolute',inset:0,zIndex:9,pointerEvents:'none'}} aria-label="A steaming cream coffee mug">
 <defs><linearGradient id={id}><stop stopColor="#bfae91"/><stop offset=".35" stopColor="#f1e4c8"/><stop offset="1" stopColor="#d2bea0"/></linearGradient></defs>
 <g ref={mug} transform="scale(0)"><path d="M-12-19C-29-24-29-2-12-5" fill="none" stroke="#cbb899" strokeWidth="2.8"/><path d="M-12-19C-26-22-26-4-12-6" fill="none" stroke="#f0e1c2" strokeWidth="1.1"/><path d="M-14-23Q-15-9-11-2Q0 4 11-2Q15-9 14-23Z" fill={`url(#${id})`} stroke="#ab987d" strokeWidth="1"/><ellipse cy="-23" rx="14" ry="5" fill="#eee0c4"/><ellipse cy="-23" rx="11" ry="3.3" fill="#c8b79b"/><path d="M-8-17Q-9-9-6-5" fill="none" stroke="#fff5df" strokeWidth="1.5" opacity=".7"/></g>
 <g ref={steam} transform="scale(0)" fill="none" stroke="#efe8da" strokeWidth="1.3" strokeLinecap="round">{[0,1,2].map(i=><path key={i}/>)}</g>
 </svg>;
}
