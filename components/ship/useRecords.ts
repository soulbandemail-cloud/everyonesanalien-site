import {useCallback,useEffect,useRef,useState} from 'react';
import {INITIAL_RECORD_STATE,selectRecordSong,type AlbumId,type RecordState,type RecordSide} from '@/lib/ship/records';
import {RecordPlayback,type PlaybackUpdate} from '@/lib/ship/recordPlayback';
export type RecordSelection=RecordState&PlaybackUpdate&{stopping:boolean;busy:boolean;revision:number;completion:number;loadedSide:RecordSide|null};
export const INITIAL_RECORD_SELECTION:RecordSelection={...INITIAL_RECORD_STATE,stopping:false,busy:false,revision:0,completion:0,loadedSide:null,currentSong:null,position:0,duration:0,endedSide:false,error:null,loading:false};
export function useRecords(){
 const [state,setState]=useState(INITIAL_RECORD_SELECTION),current=useRef(state),audio=useRef<RecordPlayback|null>(null);
 const publish=useCallback((patch:Partial<RecordSelection>)=>{current.current={...current.current,...patch};setState(current.current);},[]);
 useEffect(()=>()=>{audio.current?.dispose();audio.current=null;},[]);
 const choose=useCallback((album:AlbumId,index:number)=>{
  if(current.current.busy)return;
  const next=selectRecordSong(current.current,album,index);if(next===current.current)return;
  audio.current??=new RecordPlayback(publish);
  if(current.current.error&&current.current.selectedSong?.album===album&&current.current.selectedSong.index===index){audio.current.retry();return;}
  if(current.current.playing&&current.current.currentSong?.album===album&&current.current.currentSong.index===index){
   publish({...next,stopping:true,busy:true,revision:current.current.revision+1});return;
  }
  publish({...next,stopping:false,busy:true,revision:current.current.revision+1});
  audio.current.prepare({album,index});
 },[publish]);
 const physical=useCallback((loadedAlbum:AlbumId|null,done=false,loadedSide:RecordSide|null=null,needleReady=false,needleLifted=false)=>{
  publish({loadedAlbum,loadedSide,busy:done?false:current.current.busy,completion:current.current.completion+(done?1:0)});
  if(needleLifted)audio.current?.stop();
  if(needleReady)void audio.current?.start();
 },[publish]);
 return {state,choose,physical};
}
