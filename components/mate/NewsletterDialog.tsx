'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {portraitFrame} from '@/components/arcade/presentation';
import {restoreObjectFocus} from './objectInteraction';

const issues=[2,1] as const;
type PosterDocument={src:string;title:string;aspect:number};

/** Vector PDF pages share bounded, focal-point zoom and pan in landscape-local coordinates. */
function Newspaper({issue,rotated,poster}:{issue:number;rotated:boolean;poster?:PosterDocument}) {
 const surface=useRef<HTMLDivElement>(null),page=useRef<HTMLImageElement>(null);
 useEffect(()=>{
  const el=surface.current,img=page.current;
  if(!el || !img)return;
  let scale=1,x=0,y=0;
  const pointers=new Map<number,{x:number;y:number}>();
  const size=()=>{const w=el.clientWidth,h=el.clientHeight;const dw=poster?595:419,dh=poster?595*poster.aspect:595;const fit=Math.min(w/dw,h/dh);return {w,h,pw:dw*fit,ph:dh*fit};};
  const draw=()=>{const {w,h,pw,ph}=size();x=Math.max(-Math.max(0,(pw*scale-w)/2),Math.min(Math.max(0,(pw*scale-w)/2),x));y=Math.max(-Math.max(0,(ph*scale-h)/2),Math.min(Math.max(0,(ph*scale-h)/2),y));img.style.width=`${pw*scale}px`;img.style.height=`${ph*scale}px`;img.style.left=`${w/2+x}px`;img.style.top=`${h/2+y}px`;};
  const point=(e:{clientX:number;clientY:number})=>{const r=el.getBoundingClientRect();return rotated?{x:e.clientY-r.top,y:r.right-e.clientX}:{x:e.clientX-r.left,y:e.clientY-r.top};};
  const zoom=(next:number,p:{x:number;y:number})=>{const {w,h}=size();next=Math.max(1,Math.min(6,next));const ratio=next/scale;x=p.x-w/2-(p.x-w/2-x)*ratio;y=p.y-h/2-(p.y-h/2-y)*ratio;scale=next;};
  const wheel=(e:WheelEvent)=>{e.preventDefault();zoom(scale*Math.exp(-e.deltaY*(e.deltaMode===1?.035:.002)),point(e));draw();};
  const down=(e:PointerEvent)=>{if(e.button!==0)return;el.setPointerCapture(e.pointerId);pointers.set(e.pointerId,point(e));};
  const move=(e:PointerEvent)=>{const old=pointers.get(e.pointerId);if(!old)return;const before=[...pointers.values()];const p=point(e);pointers.set(e.pointerId,p);const after=[...pointers.values()];if(before.length===2){const center=(a:typeof before)=>({x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2});const a=center(before),b=center(after);const distance=(v:typeof before)=>Math.hypot(v[0].x-v[1].x,v[0].y-v[1].y);zoom(scale*distance(after)/Math.max(1,distance(before)),a);x+=b.x-a.x;y+=b.y-a.y;}else{x+=p.x-old.x;y+=p.y-old.y;}draw();};
  const up=(e:PointerEvent)=>{pointers.delete(e.pointerId);};
  const key=(e:KeyboardEvent)=>{if(['+','=','-','0','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const {w,h}=size();if(e.key==='0'){scale=1;x=y=0;}else if(['+','=','-'].includes(e.key))zoom(scale*(e.key==='-'?1/1.25:1.25),{x:w/2,y:h/2});else {x+=e.key==='ArrowLeft'?40:e.key==='ArrowRight'?-40:0;y+=e.key==='ArrowUp'?40:e.key==='ArrowDown'?-40:0;}draw();}};
  const observer=new ResizeObserver(draw);observer.observe(el);draw();
  el.addEventListener('wheel',wheel,{passive:false});el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('lostpointercapture',up);el.addEventListener('keydown',key);
  return ()=>{observer.disconnect();el.removeEventListener('wheel',wheel);el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);el.removeEventListener('lostpointercapture',up);el.removeEventListener('keydown',key);};
 },[rotated,poster]);
 return <div ref={surface} className="newsletter-viewport" tabIndex={0} aria-label={`${poster?.title ?? `The Hyper-Fix No.${issue}`}. Pinch or scroll to zoom, drag to pan. Keyboard: plus, minus, arrows, zero to reset.`}>
  {/* Original PDF paths, not a low-resolution screenshot. SVG image embedding disables document links. */}
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img ref={page} className="newsletter-document" src={poster?.src ?? `/hyper-fix-no${issue}.svg`} alt={poster?.title ?? `The Hyper-Fix No.${issue}`} draggable={false}/>
 </div>;
}

export default function NewsletterDialog({onClose,viewport,poster}:{poster?:PosterDocument;onClose:()=>void;viewport:{view:{width:number;height:number};mobile:boolean;left:number;top:number}}) {
 const frame=portraitFrame(viewport.view.width,viewport.view.height,viewport.mobile);
 const dialog=useRef<HTMLDialogElement>(null);
 const [issue,setIssue]=useState<number>(2),[archive,setArchive]=useState(false);
 useEffect(()=>{
  const element=dialog.current,previousFocus=document.activeElement;
  element?.showModal();
  return ()=>{element?.close();restoreObjectFocus(previousFocus);};
 },[]);
 return <dialog ref={dialog} className="newsletter-dialog" aria-label={poster?.title ?? "The Hyper-Fix newsletter"} onCancel={event=>{event.preventDefault();onClose();}}>
  <div className="newsletter-frame" data-mobile={viewport.mobile || undefined} style={viewport.mobile ? {position:'absolute',left:viewport.left,top:viewport.top,width:frame.width,height:frame.height,transformOrigin:'0 0',transform:frame.rotated?`translateX(${frame.height}px) rotate(90deg)`:'none'} as CSSProperties : undefined}>
   {!poster&&<button className="newsletter-archive object-back" type="button" onClick={()=>setArchive(true)}>ARCHIVE</button>}
   <button className="newsletter-close object-back" type="button" onClick={onClose} autoFocus>BACK</button>
   {archive?<section className="newsletter-issues" aria-label="Hyper-Fix archive"><h2>THE HYPER-FIX ARCHIVE</h2>{issues.map(number=><button className="pink-border-glow" key={number} onClick={()=>{setIssue(number);setArchive(false);}}>THE HYPER-FIX NO.{number}</button>)}</section>:<Newspaper poster={poster} key={issue} issue={issue} rotated={viewport.mobile && frame.rotated}/>}
  </div>
 </dialog>;
}
