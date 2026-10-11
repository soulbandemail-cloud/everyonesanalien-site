import {useEffect,useState} from 'react';
import {CLOTHING_STORAGE,validOutfit,toggleOutfit,type ClothingId,type Outfit,type ClothesSpin} from '@/lib/ship/clothing';
export function useClothing(){
 const [selection,setSelection]=useState<{outfit:Outfit;revision:number}>({outfit:null,revision:0});
 useEffect(()=>{
  let restoreFrame=0;
  const restore=()=>{let outfit:Outfit=null;try{outfit=validOutfit(localStorage.getItem(CLOTHING_STORAGE));}catch{}cancelAnimationFrame(restoreFrame);restoreFrame=requestAnimationFrame(()=>setSelection({outfit,revision:0}));};
  restore();const sync=(e:StorageEvent)=>{if(e.key===CLOTHING_STORAGE)restore();};window.addEventListener('storage',sync);return()=>{cancelAnimationFrame(restoreFrame);window.removeEventListener('storage',sync);};
 },[]);
 return {selection,choose:(id:ClothingId)=>setSelection(old=>{
  const outfit=toggleOutfit(old.outfit,id);try{if(outfit)localStorage.setItem(CLOTHING_STORAGE,outfit);else localStorage.removeItem(CLOTHING_STORAGE);}catch{/* Clothing still works when storage is unavailable. */}
  return {outfit,revision:old.revision+1};
 })};
}
/** Queue during the approach; navigation always wins if redirected. No movement state is owned here. */
export function useClothesSpin(selection:{outfit:Outfit;revision:number},atRail:boolean,ready:boolean){
 const [appearance,setAppearance]=useState<{outfit:Outfit;spin?:ClothesSpin}>({outfit:selection.outfit});
 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>|undefined;
  const frame=requestAnimationFrame(()=>{
   if(atRail&&!ready&&selection.revision)return;
   if(!atRail||!selection.revision||window.matchMedia('(prefers-reduced-motion: reduce)').matches){setAppearance({outfit:selection.outfit});return;}
   setAppearance(old=>{
    const current=old.spin&&performance.now()-old.spin.started>=360?old.spin.to:old.outfit;
    if(current===selection.outfit)return {outfit:current};
    return {outfit:current,spin:{started:performance.now(),from:current,to:selection.outfit}};
   });
   timer=setTimeout(()=>setAppearance({outfit:selection.outfit}),720);
  });
  return()=>{cancelAnimationFrame(frame);clearTimeout(timer);};
 },[selection.outfit,selection.revision,atRail,ready]);
 return appearance;
}
