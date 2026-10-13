import {useCallback,useRef,useState} from 'react';
import {INITIAL_RECORD_STATE,selectRecordSong,type AlbumId,type RecordState} from '@/lib/ship/records';
export type RecordSelection=RecordState&{busy:boolean;revision:number;completion:number};
export const INITIAL_RECORD_SELECTION:RecordSelection={...INITIAL_RECORD_STATE,busy:false,revision:0,completion:0};
export function useRecords(){
 const [state,setState]=useState(INITIAL_RECORD_SELECTION),current=useRef(state);
 const choose=useCallback((album:AlbumId,index:number)=>{
  if(current.current.busy)return;
  const next=selectRecordSong(current.current,album,index);if(next===current.current)return;
  current.current={...current.current,...next,busy:true,revision:current.current.revision+1};setState(current.current);
 },[]);
 const physical=useCallback((loadedAlbum:AlbumId|null,done=false)=>{
  current.current={...current.current,loadedAlbum,busy:done?false:current.current.busy,completion:current.current.completion+(done?1:0)};setState(current.current);
 },[]);
 return {state,choose,physical};
}
