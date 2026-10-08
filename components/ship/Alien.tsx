import { useLayoutEffect, useRef } from 'react';
import { pilotChairVolume } from '@/lib/ship/pilotChairVolume';
import { alienVolume, alienLookYaw, advanceAlienYaw, type AlienMotion } from '@/lib/ship/alienVolume';
import styles from './ship.module.css';
export type Attention = { x: number; back: number; down: number };
export function Alien({ attention, chair=true, occupant=true, facing, standing=false, motion={},chairHighlighted=false }: { attention: Attention; chair?:boolean; occupant?:boolean; facing?:number; standing?:boolean; motion?:AlienMotion;chairHighlighted?:boolean }) {
 const canvas=useRef<HTMLCanvasElement>(null);
 const yaw = facing ?? alienLookYaw(attention.x,attention.back);
 const target=useRef({yaw,down:attention.down,chair,occupant,standing,motion,chairHighlighted});
 useLayoutEffect(()=>{target.current={yaw,down:attention.down,chair,occupant,standing,motion,chairHighlighted};},[yaw,attention.down,chair,occupant,standing,motion,chairHighlighted]);
 useLayoutEffect(()=>{
  const context=canvas.current?.getContext('2d');
  if(!context)return;
  let frame=0,previous=performance.now(),currentYaw=target.current.yaw;
  let paintedYaw=NaN,paintedDown=NaN,paintedMode="";
  const draw=(time:number)=>{
  const dt=Math.min((time-previous)/1000,.05);previous=time;
  currentYaw=advanceAlienYaw(currentYaw,target.current.yaw,dt);
  const down=target.current.down;
  const mode=`${target.current.chair}-${target.current.occupant}-${target.current.standing}-${target.current.chairHighlighted}-${JSON.stringify(target.current.motion)}`;
  if(currentYaw!==paintedYaw || down!==paintedDown || mode!==paintedMode){
  paintedMode=mode;
  paintedYaw=currentYaw;paintedDown=down;
  // Draw the same depth-sorted surfaces without reconciling thousands of SVG
  // elements on every pointer frame. Extra space above accommodates the neck.
  context.setTransform(2,0,0,2,0,140);
  context.clearRect(0,-70,180,320);
  const mesh=[...(target.current.occupant?alienVolume(currentYaw,down,target.current.standing,target.current.motion):[]),...(target.current.chair?pilotChairVolume(currentYaw):[])].sort((a,b)=>a.depth-b.depth);
  if(target.current.chairHighlighted && target.current.chair && !target.current.occupant){
   context.strokeStyle='#6ee7b7';context.fillStyle='#6ee7b7';context.lineWidth=9;context.lineJoin='round';
   for(const face of pilotChairVolume(currentYaw)){const path=new Path2D(face.d);context.fill(path);context.stroke(path);}
  }
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
