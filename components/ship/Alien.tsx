import {paintEmoteEffects} from '@/lib/ship/emoteEffects';
import {emotePose,type EmoteControl} from '@/lib/ship/charlieEmotes';
import type {RefObject} from 'react';
import {clothesFrame,type Outfit,type ClothesSpin} from '@/lib/ship/clothing';
import {loadWearableInk,paintWearableInk} from '@/lib/ship/wearableArtwork';
import { useLayoutEffect, useRef } from 'react';
import { createAmbient } from '@/lib/ship/charlieAmbient';
import { pilotChairVolume } from '@/lib/ship/pilotChairVolume';
import { alienVolume, alienLookYaw, advanceAlienYaw, type AlienMotion } from '@/lib/ship/alienVolume';
import styles from './ship.module.css';
export type Attention = { x: number; back: number; down: number };
export function Alien({ attention, chair=true, occupant=true, facing, standing=false, motion={}, ambient, outfit=null, spin, emote }: { emote?:RefObject<EmoteControl>;attention: Attention; outfit?:Outfit;spin?:ClothesSpin;chair?:boolean; occupant?:boolean; facing?:number; standing?:boolean; motion?:AlienMotion; ambient?:'pilot'|'standing' }) {
 const canvas=useRef<HTMLCanvasElement>(null);
 const yaw = facing ?? alienLookYaw(attention.x,attention.back);
 const target=useRef({yaw,controlled:facing!==undefined,down:attention.down,chair,occupant,standing,motion,ambient,outfit,spin,emote});
 useLayoutEffect(()=>{target.current={yaw,controlled:facing!==undefined,down:attention.down,chair,occupant,standing,motion,ambient,outfit,spin,emote};},[yaw,facing,attention.down,chair,occupant,standing,motion,ambient,outfit,spin,emote]);
 useLayoutEffect(()=>{
  const screen=canvas.current?.getContext('2d');
  if(!screen)return;
  const spinCanvas=document.createElement('canvas');spinCanvas.width=360;spinCanvas.height=800;
  const spinContext=spinCanvas.getContext('2d')!;
  const personality=createAmbient();
  let inputUntil=0;
  const interrupt=()=>{inputUntil=performance.now()+1000;};
  window.addEventListener('pointermove',interrupt,{passive:true});
  window.addEventListener('pointerdown',interrupt,{passive:true});
  window.addEventListener('keydown',interrupt);
  let frame=0,previous=performance.now(),currentYaw=target.current.yaw;
  let paintedYaw=NaN,paintedDown=NaN,paintedMode="",walkBlend=0,lastPaint=-Infinity;
  let chairYaw=NaN;
  let chairMesh:Array<ReturnType<typeof pilotChairVolume>[number]&{path:Path2D}>=[];
  const coarse=window.matchMedia('(pointer: coarse)');
  const mobile=()=>coarse.matches||!!canvas.current?.closest('[data-mobile="true"]');
  const ink=loadWearableInk(()=>{paintedMode="";});
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
  const change=clothesFrame(reduced.matches?undefined:target.current.spin,time,target.current.spin&&reduced.matches?target.current.spin.to:target.current.outfit);
  const gesture=emotePose(target.current.emote?.current.command??null,time,reduced.matches);
  const gesturing=gesture.raise>.001||Math.abs(gesture.lean)>.001;
  const ambientPose=personality.tick(dt,target.current.occupant&&!gesturing&&!target.current.spin&&!document.querySelector('dialog[open]')?target.current.ambient:undefined,time<inputUntil,reduced.matches);
  const motion={...target.current.motion,moving:reduced.matches?0:walkBlend,life,ambient:ambientPose,emote:gesture,outfit:change.outfit};
  // Keep simulation on its existing clock; only expensive mesh painting is capped.
  // A small tolerance avoids dropping to 20fps on slightly uneven 60Hz frames.
  if(mobile()&&time-lastPaint<1000/30-1){frame=requestAnimationFrame(draw);return;}
  const mode=!target.current.occupant?`chair-${target.current.chair}`:`${target.current.chair}-${target.current.occupant}-${target.current.standing}-${JSON.stringify(motion)}-${change.yaw}`;
  if(currentYaw!==paintedYaw || down!==paintedDown || mode!==paintedMode){
  lastPaint=time;
  paintedMode=mode;
  paintedYaw=currentYaw;paintedDown=down;
  // Draw the same depth-sorted surfaces without reconciling thousands of SVG
  // elements on every pointer frame. Extra space above accommodates the neck.
  // Reaching across the cabinet needs canvas room beyond Charlie's normal silhouette.
  const reaching=(target.current.motion.ritualAmount??0)>0||gesturing;
  screen.canvas.style.left=reaching?'-50%':'0';screen.canvas.style.width=reaching?'200%':'100%';
  const canvasWidth=reaching?720:360;
  if(screen.canvas.width!==canvasWidth)screen.canvas.width=canvasWidth;
  const context=change.haze>0?spinContext:screen;
  screen.setTransform(1,0,0,1,0,0);screen.clearRect(0,0,canvasWidth,800);
  context.setTransform(2,0,0,2,reaching?180:0,300);
  context.clearRect(-90,-150,360,400);
  if(target.current.chair&&chairYaw!==currentYaw){
   chairYaw=currentYaw;chairMesh=pilotChairVolume(currentYaw).map(face=>({...face,path:new Path2D(face.d)}));
  }
  const mesh:Array<{d:string;fill:string;depth:number;path?:Path2D;texture?:Parameters<typeof paintWearableInk>[2]}>=[...(target.current.occupant?alienVolume(currentYaw+change.yaw,down,target.current.standing,motion):[]),...(target.current.chair?chairMesh:[])].sort((a,b)=>a.depth-b.depth);
  // Local canvas blur only; furniture and chair stay sharp.
  context.filter='none';
  context.lineWidth=.3;context.lineJoin='round';
  for(const face of mesh){
   const path=face.path??new Path2D(face.d);
   context.fillStyle=face.fill;context.strokeStyle=face.fill;
   if('texture' in face && face.texture){if(ink.ready)paintWearableInk(context,ink.canvas,face.texture);}
   else {context.fill(path);context.stroke(path);}
  }
  paintEmoteEffects(context,gesture,currentYaw);
  if(change.haze>0){
   screen.save();screen.globalAlpha=change.haze*.22;screen.filter=`blur(${change.haze*6}px)`;
   screen.drawImage(spinCanvas,-change.haze*12,0,360+change.haze*24,800);
   screen.globalAlpha=1;screen.filter=`blur(${change.haze*2.5}px)`;screen.drawImage(spinCanvas,0,0);screen.restore();
  }
  }
  frame=requestAnimationFrame(draw);
  };
  frame=requestAnimationFrame(draw);
  return ()=>{ink.dispose();cancelAnimationFrame(frame);window.removeEventListener('pointermove',interrupt);window.removeEventListener('pointerdown',interrupt);window.removeEventListener('keydown',interrupt);};
 },[]);
 return <div className={styles.alien} data-outfit={outfit??"none"} data-changing={!!spin||undefined} aria-label="Seated alien sharing your attention">
 {chair && <div className={styles.chairStem} aria-hidden="true"/>}
 <canvas ref={canvas} width={360} height={800} style={{position:'absolute',top:'-60%',maxWidth:'none',left:(motion.ritualAmount??0)>0?'-50%':0,width:(motion.ritualAmount??0)>0?'200%':'100%',height:'160%'}} aria-hidden="true"/>
 {chair && <div className={styles.chairBase}/>}</div>;
}
