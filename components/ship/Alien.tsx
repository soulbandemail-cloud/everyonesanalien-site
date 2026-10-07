import { useLayoutEffect, useRef } from 'react';
import { pilotChairVolume } from '@/lib/ship/pilotChairVolume';
import { alienVolume, alienLookYaw } from '@/lib/ship/alienVolume';
import styles from './ship.module.css';
export type Attention = { x: number; back: number; down: number };
export function Alien({ attention }: { attention: Attention }) {
 const canvas=useRef<HTMLCanvasElement>(null);
 const yaw = alienLookYaw(attention.x,attention.back);
 useLayoutEffect(()=>{
  const context=canvas.current?.getContext('2d');
  if(!context)return;
  // Draw the same depth-sorted surfaces without reconciling thousands of SVG
  // elements on every pointer frame. Extra space above accommodates the neck.
  context.setTransform(2,0,0,2,0,60);
  context.clearRect(0,-30,180,280);
  const mesh=[...alienVolume(yaw,attention.down),...pilotChairVolume(yaw)].sort((a,b)=>a.depth-b.depth);
  context.lineWidth=.3;context.lineJoin='round';
  for(const face of mesh){
   const path=new Path2D(face.d);
   context.fillStyle=face.fill;context.strokeStyle=face.fill;
   context.fill(path);context.stroke(path);
  }
 },[yaw,attention.down]);
 return <div className={styles.alien} aria-label="Seated alien sharing your attention">
 <canvas ref={canvas} width={360} height={560} style={{position:'absolute',top:'-12%',width:'100%',height:'112%'}} aria-hidden="true"/>
 <div className={styles.chairBase}/></div>;
}
