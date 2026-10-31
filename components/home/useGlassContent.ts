'use client';
import {useLayoutEffect,useRef,type RefObject} from 'react';
import {domeContentMap} from '@/lib/ship/domeContentProjection';
import type {DomeConfig,Viewport} from '@/lib/ship/domeGeometry';

/** Keep real DOM and native hit testing. Each content patch gets its own local
 * spherical derivative; layout boxes, scroll containers and columns stay intact. */
export function useGlassContent(root:RefObject<HTMLDivElement|null>,config:DomeConfig,view:Viewport,active:boolean){
 const camera=useRef(config),reproject=useRef<()=>void>(()=>{});
 useLayoutEffect(()=>{camera.current=config;reproject.current();},[config]);
 useLayoutEffect(()=>{
  const node=root.current;if(!node||!active)return;
  const presentation=node.closest<HTMLElement>('[data-cockpit-presentation]');
  const saved=new Map<HTMLElement,{transform:string;origin:string}>();
  const transitions=new Map<HTMLElement,string>();
  const layers=new Map<HTMLElement,string>();
  let frame=0;
  const restore=()=>{saved.forEach((s,el)=>{el.style.transform=s.transform;el.style.transformOrigin=s.origin;});saved.clear();};
  let patches:{el:HTMLElement;left:number;top:number;x:number;y:number;base:DOMMatrix}[]=[];
  const apply=()=>{
   const map=domeContentMap(camera.current,view);
   for(const {el,left,top,x,y,base} of patches){
    const p=map(x,y),a=map(x+.5,y),b=map(x-.5,y),c=map(x,y+.5),d=map(x,y-.5);
    const j=new DOMMatrix([a.x-b.x,a.y-b.y,c.x-d.x,c.y-d.y,0,0]);
    j.e=p.x-j.a*x-j.c*y;j.f=p.y-j.b*x-j.d*y;
    const result=new DOMMatrix().translate(-left,-top).multiply(j).translate(left,top).multiply(base);
    el.style.transformOrigin='0 0';el.style.transform=result.toString();
   }
  };
  reproject.current=apply;
  const paint=()=>{
   restore();
   const outer=presentation?.style.transform;
   if(outer)presentation!.style.transform='none';
   try{

    // Project each scrolling viewport with its contents so its clip edge follows
    // the same surface. Native scrolling stays below the separate collection title.
    const selector='.clothing-collection, .record-collection, .dome-information p > span, [data-glass-text], [data-soul-letter], [data-world-object="planet-heart"], [data-dome-caption], [data-dome-slot="socials"] > a, .dome-information h2, .dome-information h3, .dome-information p, .dome-information input, .dome-information button, .dome-information a';
    const elements=Array.from(node.querySelectorAll<HTMLElement>(selector)).filter(el=>!el.matches('h2,p')||!el.querySelector('[data-glass-text]')); 
    const warning=presentation?.querySelector<HTMLElement>('.rotation-reminder');if(warning)elements.push(warning);
    elements.forEach(el=>{if(!transitions.has(el)){transitions.set(el,el.style.transitionProperty);layers.set(el,el.style.willChange);el.style.willChange='transform';el.style.transitionProperty='color, background-color, border-color, opacity, filter';}});
    // Read every unwarped box first, then write: avoid repeated layout flushes.
    patches=elements.filter(el=>!elements.some(parent=>parent!==el&&parent.contains(el))).filter(el=>el.getClientRects().length).map(el=>{
     const rect=el.getBoundingClientRect(),style=getComputedStyle(el),m=new DOMMatrix(style.transform==='none'?undefined:style.transform);
     const [ox,oy]=style.transformOrigin.split(' ').map(parseFloat);
     const base=new DOMMatrix().translate(ox,oy).multiply(m).translate(-ox,-oy);
     const corners=[[0,0],[el.offsetWidth,0],[0,el.offsetHeight],[el.offsetWidth,el.offsetHeight]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(base));
     const left=rect.left-Math.min(...corners.map(p=>p.x)),top=rect.top-Math.min(...corners.map(p=>p.y));
     const x=rect.left+rect.width/2,y=rect.top+rect.height/2;
     saved.set(el,{transform:el.style.transform,origin:el.style.transformOrigin});
     return {el,left,top,x,y,base};
    });
    apply();
   }finally{if(outer)presentation!.style.transform=outer;}
  };
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(paint);};
  paint();
  // Header layout can settle after a font load. Reproject its new base transforms
  // in that same frame, rather than briefly exposing the uncurved Planet Heart.
  const headerLayout=()=>{
   for(const el of saved.keys())if(el.matches('[data-soul-letter], [data-world-object="planet-heart"], [data-dome-caption], [data-dome-slot="socials"] > a'))saved.delete(el);
   paint();
  };
  node.addEventListener('dome-header-layout',headerLayout);
  const changes=new MutationObserver(schedule);
  changes.observe(node,{childList:true,subtree:true,attributes:true,attributeFilter:['data-dome-menu','hidden','aria-expanded']});
  node.addEventListener('scroll',schedule,true);
  document.fonts?.addEventListener('loadingdone',schedule);
  const resize=new ResizeObserver(schedule);resize.observe(node);
  return()=>{reproject.current=()=>{};cancelAnimationFrame(frame);changes.disconnect();resize.disconnect();node.removeEventListener('dome-header-layout',headerLayout);node.removeEventListener('scroll',schedule,true);document.fonts?.removeEventListener('loadingdone',schedule);restore();transitions.forEach((value,el)=>{el.style.transitionProperty=value;el.style.willChange=layers.get(el)??'';});};
 },[root,view,active]);
}
