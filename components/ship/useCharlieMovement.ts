import {useCallback,useEffect,useRef,useState} from 'react';
import type {DomeConfig,Vec3} from '@/lib/ship/domeGeometry';
import {ROOM,pilotPosition} from '@/lib/ship/roomGeometry';
import {advanceAlienYaw} from '@/lib/ship/alienVolume';
import {approaches,findPath,groundHeight,type Point,type Arrival,type CharlieMode,type Destination} from '@/lib/ship/charlieNavigation';
export type CharlieState={mode:CharlieMode;position:Vec3;yaw:number;lookUp:boolean;phase:'rising'|'sitting'|null;stand:number;gait:number;moving:number;paper:number};
const pilotSeat={...pilotPosition,y:pilotPosition.y+ROOM.pilotSeatLift};
const initial:CharlieState={mode:'pilot-seated',position:pilotSeat,yaw:180,lookUp:false,phase:null,stand:0,gait:0,moving:0,paper:0};
type Transition={from:CharlieState;to:Vec3;time:number;duration:number;kind:'rising'|'sitting';seat:'pilot-seated'|'sofa-seated';yaw:number};
const ease=(t:number)=>t*t*(3-2*t);
export function useCharlieMovement(config:DomeConfig,seatedYaw=180){
 const [state,setState]=useState(initial),current=useRef(initial),pilotYaw=useRef(seatedYaw);
 useEffect(()=>{pilotYaw.current=seatedYaw;},[seatedYaw]);
 const command=useRef<{path:Point[];arrival:Arrival;done?:()=>void}|null>(null),transition=useRef<Transition|null>(null);
 const lastStanding=useRef<Point>({x:0,z:6.55});
 const publish=useCallback((value:CharlieState)=>{current.current=value;setState(value);},[]);
 const go=useCallback((arrival:Arrival,done?:()=>void)=>{
  const old=current.current,active=transition.current;
  // A redirected seating transition reverses from its current pose, never teleports.
  const seated=old.mode==='pilot-seated'||old.mode==='sofa-seated';
  const seat=active?.seat??(old.mode==='sofa-seated'?'sofa-seated':'pilot-seated');
  const start=active||seated ? seat==='pilot-seated'?approaches(config).chair.point:lastStanding.current : old.position;
  const path=findPath(start,arrival.point,config);if(!path)return false;
  command.current={path,arrival,done};
  if(active?.kind==='rising')return true;
  if(seated||active){
   const from={...old,yaw:old.mode==='pilot-seated'&&!active?pilotYaw.current:old.yaw};
   transition.current={from,to:{...start,y:groundHeight(start,config)},time:0,duration:.75,kind:'rising',seat,yaw:seat==='pilot-seated'?180:from.yaw};
   publish({...from,phase:'rising',lookUp:false});
  }else publish({...old,mode:'walking',phase:null,lookUp:false,paper:0});
  return true;
 },[config,publish]);
 const interact=useCallback((name:Destination,action?:()=>void)=>{
  if(name==='chair'&&current.current.mode==='pilot-seated'&&!transition.current)return;
  if(name==='tv'&&current.current.mode==='pilot-seated'&&!transition.current){action?.();return;}
  if(name!=='arcade')action?.();
  go(approaches(config)[name],name==='arcade'?action:undefined);
 },[config,go]);
 useEffect(()=>{
  let frame=0,previous=performance.now();
  const tick=(time:number)=>{
   const dt=Math.min((time-previous)/1000,.05);previous=time;
   const tween=transition.current,old=current.current;
   if(tween){
    tween.time+=dt;const t=Math.min(1,tween.time/tween.duration),s=ease(t);
    const sitting=tween.kind==='sitting';
    // Turn in place first; then a small backwards hop into the seat and settle.
    const travel=sitting?ease(Math.max(0,(t-.28)/.72)):ease(Math.max(0,(t-.18)/.82));
    const hop=sitting?.085*Math.sin(Math.PI*Math.max(0,(t-.28)/.72)): .045*Math.sin(Math.PI*t);
    const position={x:tween.from.position.x+(tween.to.x-tween.from.position.x)*travel,y:tween.from.position.y+(tween.to.y-tween.from.position.y)*travel+hop,z:tween.from.position.z+(tween.to.z-tween.from.position.z)*travel};
    const stand=sitting?1-ease(Math.max(0,(t-.4)/.6)):tween.from.stand+(1-tween.from.stand)*s;
    const value={...old,position,stand,yaw:advanceAlienYaw(old.yaw,tween.yaw,dt),moving:0,paper:sitting&&tween.seat==='sofa-seated'?Math.max(0,(t-.7)/.3):tween.from.paper*(1-Math.min(1,t*4))};
    if(t===1){transition.current=null;publish({...value,position:tween.to,stand:sitting?0:1,phase:null,mode:sitting?tween.seat:command.current?'walking':'standing',paper:sitting&&tween.seat==='sofa-seated'?1:0});}
    else publish(value);
   }else if(command.current){
    const active=command.current;let distance=dt*1.92,position=old.position,yaw=old.yaw,travelled=0;
    while(active.path.length&&distance>0){const next=active.path[0],dx=next.x-position.x,dz=next.z-position.z,length=Math.hypot(dx,dz);if(length>.001)yaw=Math.atan2(-dx,dz)*180/Math.PI;
     const run=Math.min(length,distance);travelled+=run;
     if(length<=distance){position={...next,y:groundHeight(next,config)};active.path.shift();distance-=length;}else{const p={x:position.x+dx/length*distance,z:position.z+dz/length*distance};position={...p,y:groundHeight(p,config)};distance=0;}
    }
    const value={...old,position,yaw:advanceAlienYaw(old.yaw,yaw,dt),stand:1,gait:old.gait+travelled*8,moving:Math.min(1,old.moving+dt*5),phase:null,paper:0,lookUp:false};
    if(!active.path.length){command.current=null;lastStanding.current=active.arrival.point;const a=active.arrival;
     if(a.mode==='pilot-seated'||a.mode==='sofa-seated'){
      transition.current={from:value,to:a.mode==='pilot-seated'?pilotSeat:a.seat!,time:0,duration:1,kind:'sitting',seat:a.mode,yaw:a.mode==='pilot-seated'?180:a.yaw};
      publish({...value,mode:'standing',phase:'sitting'});
     }else publish({...value,yaw:a.retainHeading?value.yaw:a.yaw,mode:a.mode,lookUp:!!a.lookUp});
     active.done?.();
    }else publish({...value,mode:'walking'});
   }else if(old.moving>0)publish({...old,moving:Math.max(0,old.moving-dt*5)});
   frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);return ()=>cancelAnimationFrame(frame);
 },[config,publish]);
 return {state,interact,walk:(point:Point)=>go({point,yaw:current.current.yaw,mode:'standing',retainHeading:true})};
}
