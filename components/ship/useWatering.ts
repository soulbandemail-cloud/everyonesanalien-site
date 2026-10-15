import {useCallback,useEffect,useRef,useState} from 'react';
import {WATERING_DURATION,type Plant,type WateringScene} from '@/lib/ship/watering';
export function useWatering(approach:(plant:Plant,done:()=>void)=>boolean,finish:(plant:Plant)=>void){
 const [scene,setScene]=useState<WateringScene|null>(null),ticket=useRef(0);
 const cancel=useCallback(()=>{ticket.current++;setScene(null);},[]);
 const water=useCallback((plant:Plant)=>{
  const token=++ticket.current;setScene(null);
  return approach(plant,()=>{if(ticket.current===token)setScene({plant,elapsed:0});});
 },[approach]);
 const plant=scene?.plant;
 useEffect(()=>{
  if(!plant)return;
  let frame=0,elapsed=0,previous=performance.now(),painted=0;
  const tick=(now:number)=>{
   const dt=(now-previous)/1000;previous=now;
   if(!document.hidden)elapsed+=dt;
   if(elapsed>=WATERING_DURATION){setScene(null);finish(plant);return;}
   if(now-painted>=1000/30){painted=now;setScene({plant,elapsed});}
   frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  return()=>cancelAnimationFrame(frame);
 },[plant,finish]);
 return {scene,water,cancel};
}
