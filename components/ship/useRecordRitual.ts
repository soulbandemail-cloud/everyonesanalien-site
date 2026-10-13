import {useEffect,useRef,useState} from 'react';
import {recordRitual,restingGramophone,ritualFrame,type RitualStep} from '@/lib/ship/recordRitual';
import type {AlbumId} from '@/lib/ship/records';
import type {RecordSelection} from './useRecords';
export function useRecordRitual(selection:RecordSelection,approach:(done:()=>void)=>boolean,onPhysical:(album:AlbumId|null,done?:boolean)=>void){
 const [scene,setScene]=useState(restingGramophone),current=useRef(scene),seen=useRef(0);
 const active=useRef<{steps:RitualStep[];elapsed:number}|null>(null),callback=useRef(onPhysical);
 useEffect(()=>{callback.current=onPhysical;},[onPhysical]);
 useEffect(()=>{
  if(!selection.busy||!selection.selectedSong||seen.current===selection.revision)return;
  seen.current=selection.revision;const song=selection.selectedSong;
  if(!approach(()=>{active.current={steps:recordRitual(current.current,song.album,song.index),elapsed:0};}))callback.current(current.current.loadedAlbum,true);
 },[selection,approach]);
 useEffect(()=>{
  let frame=0,previous=performance.now(),painted=0;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const tick=(now:number)=>{
   const dt=Math.max(0,(now-previous)/1000);previous=now;
   if(document.hidden){frame=requestAnimationFrame(tick);return;}
   if(active.current){
    active.current.elapsed+=dt*(reduced.matches?2:1);
    // Keep real-time duration on slow devices while limiting React/SVG work.
    if(now-painted<1000/30){frame=requestAnimationFrame(tick);return;}
    painted=now;
    const next=ritualFrame(active.current.steps,active.current.elapsed);
    const changed=next.scene.loadedAlbum!==current.current.loadedAlbum;
    current.current=next.scene;setScene(next.scene);
    if(next.done)active.current=null;
    if(changed||next.done)callback.current(next.scene.loadedAlbum,next.done);
   }
   frame=requestAnimationFrame(tick);
  };
  const resetClock=()=>{previous=performance.now();};
  document.addEventListener('visibilitychange',resetClock);
  frame=requestAnimationFrame(tick);return ()=>{cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',resetClock);};
 },[]);
 return scene;
}
