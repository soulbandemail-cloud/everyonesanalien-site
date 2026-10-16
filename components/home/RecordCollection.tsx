'use client';
/* eslint-disable @next/next/no-img-element -- Exact local album covers, contained without cropping. */
import {useId,useLayoutEffect,useRef,useState} from 'react';
import {RECORDS,INITIAL_RECORD_STATE,type AlbumId,type RecordState} from '@/lib/ship/records';
export default function RecordCollection({record=INITIAL_RECORD_STATE,onChoose}:{record?:RecordState&{busy?:boolean;loading?:boolean;error?:string|null;currentSong?:{album:AlbumId;index:number}|null};onChoose?:(album:AlbumId,index:number)=>void}={}){
 const [expanded,setExpanded]=useState<AlbumId|null>(null);
 const id=useId(),list=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{
  const element=list.current,frame=element?.closest<HTMLElement>('[data-cockpit-presentation]');
  if(!element||!frame)return;
  const page=element.closest<HTMLElement>('.canonical-home');
  let raf=0;
  const measure=()=>{
   if(!element.getClientRects().length)return;
   const horizon=frame.querySelector<HTMLElement>('[data-records-horizon]');
   if(!horizon)return;
   const bounds=frame.getBoundingClientRect(),rect=element.getBoundingClientRect();
   const angle=Number(frame.dataset.presentationAngle??0)*Math.PI/180,scale=Number(frame.dataset.presentationScale??1);
   // Undo the phone's rotated presentation before comparing with the desk.
   const ys=[rect.left,rect.right].flatMap(x=>[rect.top,rect.bottom].map(y=>{
    const dx=x-bounds.left-bounds.width/2,dy=y-bounds.top-bounds.height/2;
    return (-dx*Math.sin(angle)+dy*Math.cos(angle))/scale+frame.clientHeight/2;
   }));
   const height=Math.max(40,Number(horizon.dataset.recordsHorizon)-Math.min(...ys)+8);
   const value=`${height.toFixed(2)}px`;
   if(element.style.maxHeight!==value)element.style.maxHeight=value;
  };
  const schedule=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(measure);};
  const resize=new ResizeObserver(schedule);resize.observe(frame);resize.observe(element);
  const changes=new MutationObserver(schedule);
  if(page)changes.observe(page,{attributes:true,attributeFilter:['data-dome-menu','class','style']});
  const horizon=frame.querySelector('[data-records-horizon]');
  if(horizon)changes.observe(horizon,{attributes:true,attributeFilter:['data-records-horizon']});
  schedule();window.addEventListener('resize',schedule);
  return()=>{cancelAnimationFrame(raf);resize.disconnect();changes.disconnect();window.removeEventListener('resize',schedule);};
 },[]);
 return <div ref={list} className="record-collection">{record.error&&<p className="record-playback-error" role="status">{record.error}</p>}{RECORDS.map(album=><div key={album.id} className="record-album">
  <button type="button" className="record-row pink-border-glow" aria-expanded={expanded===album.id} aria-controls={`${id}-${album.id}`} onClick={()=>setExpanded(old=>old===album.id?null:album.id)}>
   <img src={album.artwork} alt={`${album.name} cover`} width="40" height="40"/><span>{album.name}</span><span aria-hidden="true">{expanded===album.id?'−':'+'}</span>
  </button>
  <ol id={`${id}-${album.id}`} hidden={expanded!==album.id} className="record-tracks">{album.tracks.map((song,index)=><li key={song}>
   <button type="button" className="record-song pink-border-glow" aria-label={`Select ${song} preview`} aria-pressed={record.selectedSong?.album===album.id&&record.selectedSong.index===index} disabled={record.busy} onClick={()=>onChoose?.(album.id,index)}><span>{index+1}.</span><span>{song}</span>{(record.busy||record.loading)&&record.selectedSong?.album===album.id&&record.selectedSong.index===index&&<span className="record-loading" role="status" aria-label="Preparing record"/>}</button>
  </li>)}</ol>
 </div>)}</div>;
}
