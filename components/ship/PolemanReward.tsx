import {useCallback,useEffect,useRef,useState} from 'react';
import {project,type DomeConfig,type Vec3,type Viewport} from '@/lib/ship/domeGeometry';
import {ROOM,} from '@/lib/ship/roomGeometry';
import {orientedFixtures} from '@/lib/ship/fixtureLayout';
import {approaches,localPoint} from '@/lib/ship/charlieNavigation';
import type {CharlieState} from './useCharlieMovement';
import type {Arrival} from '@/lib/ship/charlieNavigation';

type Stage='waiting'|'approaching'|'reach'|'hold'|'carrying'|'placing'|'claimed';
export function usePolemanReward(config:DomeConfig,state:CharlieState,go:(a:Arrival,done:()=>void)=>boolean){
 const [unlocked,setUnlocked]=useState(false),[stage,setStage]=useState<Stage>('waiting'),[t,setT]=useState(0);
 const active=useRef(false),clock=useRef(0);
 const [aperture,setAperture]=useState(0);
 useEffect(()=>{let raf=0,last=performance.now();const target=unlocked&&stage!=='claimed'?1:0;const tick=(now:number)=>{const dt=Math.min(.05,(now-last)/1000);last=now;setAperture(v=>target?Math.min(1,v+dt):Math.max(0,v-dt));raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);const stop=window.setTimeout(()=>cancelAnimationFrame(raf),1100);return()=>{cancelAnimationFrame(raf);clearTimeout(stop);};},[unlocked,stage]);
 const change=useCallback((next:Stage)=>{clock.current=0;setT(0);setStage(next);},[]);
 useEffect(()=>{const read=()=>{try{setUnlocked(localStorage.getItem('bossDefeated')==='true');if(localStorage.getItem('bossTrophyClaimed')==='true')setStage('claimed');}catch{}};read();window.addEventListener('poleman-reward',read);return()=>window.removeEventListener('poleman-reward',read);},[]);
 const arcade=orientedFixtures(config.centre,config.radius).arcade;
 const display={...localPoint(arcade,0,-.18),y:arcade.y+2.25*arcade.scale};
 const claim=()=>{if(active.current||stage==='claimed')return;active.current=true;change('approaching');if(!go({point:{x:ROOM.port.x+.65,z:ROOM.port.z-.3},yaw:180,mode:'standing'},()=>change('reach'))){active.current=false;change('waiting');}};
 useEffect(()=>{
  if(!['reach','hold','carrying','placing'].includes(stage))return;
  let raf=0,last=performance.now();const tick=(now:number)=>{clock.current+=Math.min(.05,(now-last)/1000);last=now;setT(clock.current);
   if(stage==='reach'&&clock.current>.7)change('hold');
   else if(stage==='hold'&&clock.current>1.2){change('carrying');if(!go(approaches(config).arcade,()=>change('placing'))){active.current=false;change('waiting');}}
   else if(stage==='placing'&&clock.current>1.1){try{localStorage.setItem('bossTrophyClaimed','true');}catch{}active.current=false;change('claimed');}
   else raf=requestAnimationFrame(tick);
  };raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);
 },[stage,go,change,config]);
 // A deliberate new destination safely returns an unfinished reward to the hatch.
 useEffect(()=>{if(active.current&&state.engagement!=='trophy'){active.current=false;change('waiting');}},[state.engagement,change]);
 const hip={x:state.position.x-.25,y:state.position.y+.9,z:state.position.z};
 const raised={...hip,x:state.position.x-.65,y:state.position.y+1.5};
 const home={x:ROOM.port.x,y:ROOM.floorY+.85,z:ROOM.port.z};
 const blend=(a:Vec3,b:Vec3,n:number)=>{n=Math.max(0,Math.min(1,n));n=n*n*(3-2*n);return {x:a.x+(b.x-a.x)*n,y:a.y+(b.y-a.y)*n,z:a.z+(b.z-a.z)*n};};
 let position=stage==='claimed'?display:home;
 if(stage==='hold')position=blend(home,raised,t/.5);
 if(stage==='carrying')position=blend(raised,hip,t/.45);
 if(stage==='placing')position=blend(hip,display,t/.85);
 const hands=stage==='reach'?[undefined,blend(hip,home,t/.7)]:['hold','carrying','placing'].includes(stage)?[undefined,position]:undefined;
 return {layer:position.z>state.position.z+.05?7:9,unlocked,stage,position,hands,claim,busy:stage!=='waiting'&&stage!=='claimed',aperture,open:unlocked&&stage!=='claimed'};
}
export function PolemanReward({reward,config,view}:{reward:ReturnType<typeof usePolemanReward>;config:DomeConfig;view:Viewport}){
 if(!reward.unlocked)return null;
 const p=project(reward.position,config,view),size=p.scale*.34;
 const hologram=reward.stage==='waiting'||reward.stage==='approaching'||reward.stage==='reach';
 const floor=project({x:ROOM.port.x,y:ROOM.floorY,z:ROOM.port.z},config,view);
 return <svg width={view.width} height={view.height} style={{position:'absolute',inset:0,zIndex:reward.layer,pointerEvents:'none'}} aria-label="Poleman trophy">
 {reward.open&&hologram&&<path d={`M${floor.x-floor.scale*.3} ${floor.y} L${p.x-size*.7} ${p.y} L${p.x+size*.7} ${p.y} L${floor.x+floor.scale*.3} ${floor.y}Z`} fill="#9de6ff" opacity=".12"/>}
 <g transform={`translate(${p.x} ${p.y}) scale(${size/100})`} role={hologram?'button':undefined} tabIndex={hologram?0:undefined} aria-label={hologram?'Claim Poleman trophy':'Golden Poleman trophy'} style={{pointerEvents:hologram?'auto':'none',cursor:hologram?'pointer':undefined}} onClick={hologram?reward.claim:undefined} onKeyDown={e=>{if(hologram&&(e.key==='Enter'||e.key===' ')){e.preventDefault();reward.claim();}}}>
  <title>{hologram?'Claim Poleman trophy':'Poleman'}</title>
  {hologram&&<rect x="-80" y="-135" width="160" height="160" fill="transparent"/>}
  <TrophyModel hologram={hologram}/>

 </g></svg>;
}

function trophyPath(angle:number){
 const nodes=[[0,0,0],[0,-60,0],[0,-84,-28],[-21,-56,8],[-40,-47,12],[-84,-98,-10],[21,-56,8],[40,-47,12],[84,-98,-10]];
 const p=nodes.map(([x,y,z])=>{const xx=x*Math.cos(angle)+z*Math.sin(angle),zz=z*Math.cos(angle)-x*Math.sin(angle),scale=500/(500+zz);return `${(xx*scale).toFixed(3)},${((y+zz*.2)*scale).toFixed(3)}`;});
 return [[0,1,2],[1,3,4,5],[1,6,7,8]].map(indices=>'M'+indices.map(i=>p[i]).join('L')).join('');
}
function TrophyModel({hologram}:{hologram:boolean}){
 const path=useRef<SVGPathElement>(null);
 useEffect(()=>{if(!hologram||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;let raf=0,last=0;const start=performance.now();const tick=(now:number)=>{if(now-last>33){path.current?.setAttribute('d',trophyPath((now-start)/8000*Math.PI*2));last=now;}raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);},[hologram]);
 return <g transform="translate(0 -19)"><path d="M-30 0L22 0L30 7L30 19L-30 19L-36 12L-36 5Z" fill={hologram?'#6bc8e4':'#947024'} opacity={hologram?.6:1}/><path d="M-36 5L-28 -2L22 -2L30 7L-30 7Z" fill={hologram?'#b1efff':'#f1d47a'}/><path d="M-30 7H30V19H-30Z" fill={hologram?'#7bd7ef':'#b58c35'}/><path ref={path} d={trophyPath(0)} opacity={hologram?.75:1} stroke={hologram?'#b1efff':'#e6c25f'} strokeWidth="7" fill="none" strokeLinejoin="miter"/></g>;
}
