import {useId} from 'react';
import {project,type DomeConfig,type Vec3,type Viewport} from '@/lib/ship/domeGeometry';
import {wateringFrame,type WateringScene} from '@/lib/ship/watering';
export function WateringProps({scene,config,view,position}:{scene:WateringScene|null;config:DomeConfig;view:Viewport;position:Vec3}){
 const id=useId();if(!scene)return null;
 const f=wateringFrame(scene,config,position),p=(x:number,y:number)=>project(f.point(x,y),config,view);
 const origin=p(0,0),right=p(.01,0),up=p(0,.01);
 const soil=project(f.soil,config,view),tip=p(0,0);
 return <svg width={view.width} height={view.height} style={{position:'absolute',inset:0,zIndex:9,pointerEvents:'none'}} aria-label="Charlie’s temporary watering can">
 <defs><linearGradient id={id} x2=".8" y2="1"><stop stopColor="#88b49b"/><stop offset=".4" stopColor="#477f67"/><stop offset="1" stopColor="#295746"/></linearGradient></defs>
 <g transform={`matrix(${right.x-origin.x} ${right.y-origin.y} ${up.x-origin.x} ${up.y-origin.y} ${origin.x} ${origin.y})`} strokeLinejoin="round">
 {/* A low rounded metal vessel, narrow tapering spout and high loop handle. */}
 <path d="M-84 0Q-109 52-56 31Q-40 25-40 4" fill="none" stroke="#284f40" strokeWidth="7"/>
 <path d="M-84 0Q-109 52-56 31Q-40 25-40 4" fill="none" stroke="#699b7e" strokeWidth="4"/>
 <path d="M-48-12L-3 2L0 0L-46-23Z" fill="#60947a" stroke="#294c3f" strokeWidth="1.5"/>
 <path d="M-92-22Q-99-12-91 7Q-70 24-45 5L-39-24Q-67-38-92-22Z" fill={`url(#${id})`} stroke="#294c3f" strokeWidth="1.7"/>
 <ellipse cx="-66" cy="6" rx="23" ry="8" fill="#56846d" stroke="#8bb197" strokeWidth="1.5"/>
 <ellipse cx="-66" cy="7" rx="9" ry="5" fill="#172e27" stroke="#98b49b" strokeWidth="2"/>
 <path d="M-93-23Q-68-34-40-24M-89-19Q-68-27-43-20M-89 2Q-76 14-48 3" fill="none" stroke="#9bbba0" strokeWidth="1.3" opacity=".65"/>
 <path d="M-83-5l7 2m10-14 8 3m-12 8 10 2m-27-11 5 2" stroke="#a2bba2" strokeWidth="2" opacity=".32"/>
 <path d="M-88 10L-45 14" stroke="#739d81" strokeWidth="3"/>
 </g>
 {f.pouring&&<g fill="#d5f0ed" stroke="#b5e5e3" opacity=".8"><path d={`M${tip.x},${tip.y}L${soil.x},${soil.y}`} fill="none" strokeWidth={Math.max(.7,tip.scale*.009)} strokeLinecap="round"/>{[0,1,2].map(i=>{const t=(scene.elapsed*1.9+i/3)%1;return <ellipse key={i} cx={tip.x+(soil.x-tip.x)*t*t} cy={tip.y+(soil.y-tip.y)*t*t} rx={Math.max(.65,tip.scale*.008)} ry={Math.max(1,tip.scale*.015)}/>;})}</g>}
 </svg>;
}
