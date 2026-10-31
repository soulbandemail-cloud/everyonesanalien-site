'use client';
import {useCallback,useEffect,useState} from 'react';
import {surfaceStats} from '@/lib/ship/worldSurface';
/** Opt-in development harness; returns exactly zero at both ends. */
export function useCameraTest(ready:boolean){
 const [enabled,setEnabled]=useState(false),[running,setRunning]=useState(false),[offset,setOffset]=useState(0),[report,setReport]=useState('Ready');
 useEffect(()=>{if((process.env.NODE_ENV==='development'||process.env.NEXT_PUBLIC_CAMERA_RENDER_TEST==='1')&&['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).has('camera-test'))requestAnimationFrame(()=>setEnabled(true));},[]);
 useEffect(()=>{
  if(!running||!ready)return;
  let frame=0,start=0,last=0;const intervals:number[]=[],baseline:number[]=[],before={...surfaceStats};
  const tick=(now:number)=>{
   if(!start)start=now;if(last)(now-start<2000?baseline:intervals).push(now-last);last=now;
   const t=Math.max(0,Math.min(1,(now-start-2000)/8000));
   setOffset((1-Math.cos(t*Math.PI*2))*.5);
   if(t<1)frame=requestAnimationFrame(tick);
   else {setRunning(false);setOffset(0);intervals.sort((a,b)=>a-b);baseline.sort((a,b)=>a-b);setReport(`Idle median ${baseline[Math.floor(baseline.length*.5)]?.toFixed(1)}ms; ${intervals.length} frames; median ${intervals[Math.floor(intervals.length*.5)]?.toFixed(1)}ms; p95 ${intervals[Math.floor(intervals.length*.95)]?.toFixed(1)}ms; max ${Math.max(...intervals).toFixed(1)}ms; new meshes ${surfaceStats.meshUploads-before.meshUploads}; new textures ${surfaceStats.textureUploads-before.textureUploads}; surfaces ${((surfaceStats.drawMs-before.drawMs)/intervals.length).toFixed(1)}ms/frame`);}
  };
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[running,ready]);
 const run=useCallback(()=>{setReport('Measuring idle, then moving out and back');setRunning(true);},[]);
 return {enabled,running,offset,report,run};
}
