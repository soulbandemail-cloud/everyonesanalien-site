'use client';
/* eslint-disable @next/next/no-img-element -- Exact local album covers, contained without cropping. */
import {useId,useState} from 'react';
import {RECORDS,INITIAL_RECORD_STATE,type AlbumId,type RecordState} from '@/lib/ship/records';
export default function RecordCollection({record=INITIAL_RECORD_STATE,onChoose}:{record?:RecordState&{busy?:boolean};onChoose?:(album:AlbumId,index:number)=>void}={}){
 const [expanded,setExpanded]=useState<AlbumId|null>(null);
 const id=useId();
 return <div className="record-collection">{RECORDS.map(album=><div key={album.id} className="record-album">
  <button type="button" className="record-row pink-border-glow" aria-expanded={expanded===album.id} aria-controls={`${id}-${album.id}`} onClick={()=>setExpanded(old=>old===album.id?null:album.id)}>
   <img src={album.artwork} alt={`${album.name} cover`} width="40" height="40"/><span>{album.name}</span><span aria-hidden="true">{expanded===album.id?'−':'+'}</span>
  </button>
  <ol id={`${id}-${album.id}`} hidden={expanded!==album.id} className="record-tracks">{album.tracks.map((song,index)=><li key={song}>
   <button type="button" className="record-song pink-border-glow" aria-label={`Select ${song} preview`} aria-pressed={record.selectedSong?.album===album.id&&record.selectedSong.index===index} disabled={record.busy} onClick={()=>onChoose?.(album.id,index)}><span>{index+1}.</span><span>{song}</span>{record.busy&&record.selectedSong?.album===album.id&&record.selectedSong.index===index&&<span className="record-loading" role="status" aria-label="Preparing record"/>}</button>
  </li>)}</ol>
 </div>)}</div>;
}
