import {useEffect,useMemo,useRef,useState} from 'react';
import {recordRitual,stopRecordRitual,restingGramophone,ritualFrame,type RitualStep} from '@/lib/ship/recordRitual';
import {trackTone,type RecordSide,type AlbumId} from '@/lib/ship/records';
import type {RecordSelection} from './useRecords';
export function useRecordRitual(selection:RecordSelection,approach:(done:()=>void)=>boolean,onPhysical:(album:AlbumId|null,done?:boolean,side?:RecordSide|null,needleReady?:boolean,needleLifted?:boolean)=>void){
 const [scene,setScene]=useState(restingGramophone),current=useRef(scene),seen=useRef(0);
 const active=useRef<{steps:RitualStep[];elapsed:number;started:boolean;stopping:boolean;stopped:boolean}|null>(null),callback=useRef(onPhysical);
 useEffect(()=>{callback.current=onPhysical;},[onPhysical]);
 useEffect(()=>{if(!selection.busy&&!selection.stopping&&selection.currentSong)current.current={...current.current,tone:trackTone(selection.currentSong)};},[selection.busy,selection.stopping,selection.currentSong]);
 useEffect(()=>{
  if(!selection.busy||!selection.selectedSong||seen.current===selection.revision)return;
  seen.current=selection.revision;const song=selection.selectedSong;
  if(!approach(()=>{active.current={steps:selection.stopping?stopRecordRitual(current.current):recordRitual(current.current,song.album,song.index),elapsed:0,started:false,stopping:selection.stopping,stopped:false};}))callback.current(current.current.loadedAlbum,true);
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
    const changed=next.scene.loadedAlbum!==current.current.loadedAlbum||next.scene.loadedSide!==current.current.loadedSide;
    const needleLifted=active.current.stopping&&!active.current.stopped&&active.current.elapsed>active.current.steps[0].duration;
    if(needleLifted)active.current.stopped=true;
    const needleReady=!active.current.stopping&&(next.scene.phase==='settle'||next.done)&&!active.current.started;
    if(needleReady)active.current.started=true;
    current.current=next.scene;setScene(next.scene);
    if(next.done)active.current=null;
    if(changed||next.done||needleReady||needleLifted)callback.current(next.scene.loadedAlbum,next.done,next.scene.loadedSide,needleReady,needleLifted);
   }
   frame=requestAnimationFrame(tick);
  };
  const resetClock=()=>{previous=performance.now();};
  document.addEventListener('visibilitychange',resetClock);
  frame=requestAnimationFrame(tick);return ()=>{cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',resetClock);};
 },[]);
 const tone=!selection.busy&&!selection.stopping&&selection.currentSong?trackTone(selection.currentSong):scene.tone;
 // Playback position updates do not change the physical scene. Keep memoised
 // furniture/character props stable between actual ritual or playback changes.
 return useMemo(()=>({...scene,playing:selection.playing,tone}),[scene,selection.playing,tone]);
}
