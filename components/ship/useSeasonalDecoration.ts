import {useEffect,useState} from 'react';
import {inSeason,untilLocalMidnight,savedSeasonalLight,type SeasonalDecoration} from '@/lib/ship/seasonal';
/** Hydration-safe visibility, one midnight timer, and independently persisted lighting. */
export function useSeasonalDecoration(season:SeasonalDecoration){
 const [visible,setVisible]=useState(false),[lit,setLit]=useState(true);
 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>;
  const check=()=>{clearTimeout(timer);const now=new Date();setVisible(inSeason(now,season));timer=setTimeout(check,untilLocalMidnight(now));};
  const restore=()=>{try{setLit(savedSeasonalLight(localStorage.getItem(season.key)));}catch{}};
  const resume=()=>{if(!document.hidden){check();restore();}};
  const storage=(event:StorageEvent)=>{if(event.key===season.key||event.key===null)restore();};
  check();restore();document.addEventListener('visibilitychange',resume);window.addEventListener('focus',resume);window.addEventListener('storage',storage);
  return()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',resume);window.removeEventListener('focus',resume);window.removeEventListener('storage',storage);};
 },[season]);
 const toggle=()=>{const next=!lit;setLit(next);try{localStorage.setItem(season.key,next?'on':'off');}catch{}};
 return {visible,lit,toggle};
}
