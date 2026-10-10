import { useLayoutEffect, useRef } from 'react';
import { pilotChairVolume } from '@/lib/ship/pilotChairVolume';
import { alienVolume, alienLookYaw, advanceAlienYaw, type AlienMotion } from '@/lib/ship/alienVolume';
import styles from './ship.module.css';
export type Attention = { x: number; back: number; down: number };
export function Alien({ attention, chair=true, occupant=true, facing, standing=false, motion={} }: { attention: Attention; chair?:boolean; occupant?:boolean; facing?:number; standing?:boolean; motion?:AlienMotion }) {
 const canvas=useRef<HTMLCanvasElement>(null);
 const yaw = facing ?? alienLookYaw(attention.x,attention.back);
 const target=useRef({yaw,controlled:facing!==undefined,down:attention.down,chair,occupant,standing,motion});
 useLayoutEffect(()=>{target.current={yaw,controlled:facing!==undefined,down:attention.down,chair,occupant,standing,motion};},[yaw,facing,attention.down,chair,occupant,standing,motion]);
 useLayoutEffect(()=>{
  const context=canvas.current?.getContext('2d');
  if(!context)return;
  let frame=0,previous=performance.now(),currentYaw=target.current.yaw;
  let paintedYaw=NaN,paintedDown=NaN,paintedMode="",walkBlend=0;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const draw=(time:number)=>{
  const dt=Math.min((time-previous)/1000,.05);previous=time;
  // Walking yaw is already eased by the navigation loop; do not smooth it twice.
  currentYaw=target.current.controlled?target.current.yaw:advanceAlienYaw(currentYaw,target.current.yaw,dt);
  if(document.hidden){frame=requestAnimationFrame(draw);return;}
  const down=target.current.down;
  // Polish only the pose envelope: route speed, arrivals and interactions stay untouched.
  walkBlend+=( (target.current.motion.moving??0)-walkBlend)*(1-Math.exp(-dt*12));
  if(Math.abs(walkBlend-(target.current.motion.moving??0))<.001)walkBlend=target.current.motion.moving??0;
  const life=reduced.matches||!target.current.occupant?undefined:Math.floor(time/100)*.1;
  const motion={...target.current.motion,moving:reduced.matches?0:walkBlend,life};
  const mode=`${target.current.chair}-${target.current.occupant}-${target.current.standing}-${JSON.stringify(motion)}`;
  if(currentYaw!==paintedYaw || down!==paintedDown || mode!==paintedMode){
  paintedMode=mode;
  paintedYaw=currentYaw;paintedDown=down;
  // Draw the same depth-sorted surfaces without reconciling thousands of SVG
  // elements on every pointer frame. Extra space above accommodates the neck.
  context.setTransform(2,0,0,2,0,140);
  context.clearRect(0,-70,180,320);
  const mesh=[...(target.current.occupant?alienVolume(currentYaw,down,target.current.standing,motion):[]),...(target.current.chair?pilotChairVolume(currentYaw):[])].sort((a,b)=>a.depth-b.depth);
  context.lineWidth=.3;context.lineJoin='round';
  for(const face of mesh){
   const path=new Path2D(face.d);
   context.fillStyle=face.fill;context.strokeStyle=face.fill;
   context.fill(path);context.stroke(path);
  }
  }
  frame=requestAnimationFrame(draw);
  };
  frame=requestAnimationFrame(draw);
  return ()=>cancelAnimationFrame(frame);
 },[]);
 return <div className={styles.alien} aria-label="Seated alien sharing your attention">
 {chair && <div className={styles.chairStem} aria-hidden="true"/>}
 <canvas ref={canvas} width={360} height={640} style={{position:'absolute',top:'-28%',width:'100%',height:'128%'}} aria-hidden="true"/>
 {chair && <div className={styles.chairBase}/>}</div>;
}
