import {useCallback,useEffect,useRef,useState} from 'react';
import type {DomeConfig,Vec3} from '@/lib/ship/domeGeometry';
import {ROOM,pilotPosition} from '@/lib/ship/roomGeometry';
import {advanceAlienYaw,walkingTurn} from '@/lib/ship/alienVolume';
import {approaches,findPath,groundHeight,type Point,type Arrival,type CharlieMode,type Destination} from '@/lib/ship/charlieNavigation';
export type CharlieState={engagement:Destination|null;arcadeActive:boolean;mode:CharlieMode;position:Vec3;yaw:number;lookUp:boolean;phase:'rising'|'sitting'|null;stand:number;gait:number;moving:number;paper:number};
const pilotSeat={...pilotPosition,y:pilotPosition.y+ROOM.pilotSeatLift};
const initial:CharlieState={engagement:'chair',arcadeActive:false,mode:'pilot-seated',position:pilotSeat,yaw:180,lookUp:false,phase:null,stand:0,gait:0,moving:0,paper:0};
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
 // Physical engagement is independent of whichever domepage/dialog is visible.
 const available=useCallback((name:Destination)=>{
  const value=current.current;
  if(name==='tv')return true;
  if(value.engagement===name)return false;
  if(name==='arcade'&&value.arcadeActive)return false;
  if(name==='chair'&&(value.mode==='pilot-seated'||value.phase==='rising'))return false;
  if(name==='newsletter'&&(value.mode==='sofa-seated'||value.paper>0))return false;
  return true;
 },[]);
 const closeArcade=useCallback(()=>publish({...current.current,arcadeActive:false,engagement:current.current.engagement==='arcade'?null:current.current.engagement}),[publish]);
 const interact=useCallback((name:Destination,action?:()=>void)=>{
  if(!available(name))return;
  if(name==='tv'&&current.current.mode==='pilot-seated'&&!transition.current){action?.();return;}
  if(name!=='arcade')action?.();
  if(go(approaches(config)[name],name==='arcade'?()=>{publish({...current.current,arcadeActive:true});action?.();}:undefined)){
   publish({...current.current,engagement:name});
  }
 },[config,go,available,publish]);
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
    const active=command.current;
    while(active.path.length&&Math.hypot(active.path[0].x-old.position.x,active.path[0].z-old.position.z)<.001)active.path.shift();
    const next=active.path[0];
    const heading=next?Math.atan2(old.position.x-next.x,next.z-old.position.z)*180/Math.PI:old.yaw;
    const turn=walkingTurn(old.yaw,heading,dt);
    let distance=turn.canTravel?dt*2.4:0,position=old.position,travelled=0;
    const yaw=turn.yaw;
    while(active.path.length&&distance>0){const next=active.path[0],dx=next.x-position.x,dz=next.z-position.z,length=Math.hypot(dx,dz);if(length>.001){
      const nextHeading=Math.atan2(-dx,dz)*180/Math.PI;
      if(Math.abs(((nextHeading-yaw+540)%360+360)%360-180)>22)break;
     }
     const run=Math.min(length,distance);travelled+=run;
     if(length<=distance){position={...next,y:groundHeight(next,config)};active.path.shift();distance-=length;}else{const p={x:position.x+dx/length*distance,z:position.z+dz/length*distance};position={...p,y:groundHeight(p,config)};distance=0;}
    }
    const value={...old,position,yaw,stand:1,gait:old.gait+travelled*6.4,moving:travelled>0?Math.min(1,old.moving+dt*5):Math.max(0,old.moving-dt*12),phase:null,paper:0,lookUp:false};
    if(!active.path.length){value.position={...active.arrival.point,y:groundHeight(active.arrival.point,config)};command.current=null;lastStanding.current=active.arrival.point;const a=active.arrival;
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
 return {state,interact,available,closeArcade,walk:(point:Point)=>{
  const accepted=go({point,yaw:current.current.yaw,mode:'standing',retainHeading:true});
  if(accepted)publish({...current.current,engagement:null});
  return accepted;
 }};
}
