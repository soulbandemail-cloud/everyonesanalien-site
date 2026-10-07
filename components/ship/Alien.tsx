import { useLayoutEffect, useRef } from 'react';
import { pilotChairVolume } from '@/lib/ship/pilotChairVolume';
import { alienVolume, alienLookYaw, advanceAlienYaw } from '@/lib/ship/alienVolume';
import styles from './ship.module.css';
export type Attention = { x: number; back: number; down: number };
export function Alien({ attention }: { attention: Attention }) {
 const canvas=useRef<HTMLCanvasElement>(null);
 const yaw = alienLookYaw(attention.x,attention.back);
 const target=useRef({yaw,down:attention.down});
 useLayoutEffect(()=>{target.current={yaw,down:attention.down};},[yaw,attention.down]);
 useLayoutEffect(()=>{
  const context=canvas.current?.getContext('2d');
  if(!context)return;
  let frame=0,previous=performance.now(),currentYaw=target.current.yaw;
  let paintedYaw=NaN,paintedDown=NaN;
  const draw=(time:number)=>{
  const dt=Math.min((time-previous)/1000,.05);previous=time;
  currentYaw=advanceAlienYaw(currentYaw,target.current.yaw,dt);
  const down=target.current.down;
  if(currentYaw!==paintedYaw || down!==paintedDown){
  paintedYaw=currentYaw;paintedDown=down;
  // Draw the same depth-sorted surfaces without reconciling thousands of SVG
  // elements on every pointer frame. Extra space above accommodates the neck.
  context.setTransform(2,0,0,2,0,60);
  context.clearRect(0,-30,180,280);
  const mesh=[...alienVolume(currentYaw,down),...pilotChairVolume(currentYaw)].sort((a,b)=>a.depth-b.depth);
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
 <div className={styles.chairStem} aria-hidden="true"/>
 <canvas ref={canvas} width={360} height={560} style={{position:'absolute',top:'-12%',width:'100%',height:'112%'}} aria-hidden="true"/>
 <div className={styles.chairBase}/></div>;
}
