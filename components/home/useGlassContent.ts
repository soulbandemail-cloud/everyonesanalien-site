'use client';
import {useLayoutEffect,type RefObject} from 'react';
import {domeContentMap} from '@/lib/ship/domeContentProjection';
import type {DomeConfig,Viewport} from '@/lib/ship/domeGeometry';

/** Keep real DOM and native hit testing. Each content patch gets its own local
 * spherical derivative; layout boxes, scroll containers and columns stay intact. */
export function useGlassContent(root:RefObject<HTMLDivElement|null>,config:DomeConfig,view:Viewport,active:boolean){
 useLayoutEffect(()=>{
  const node=root.current;if(!node||!active)return;
  const presentation=node.closest<HTMLElement>('[data-cockpit-presentation]');
  const saved=new Map<HTMLElement,{transform:string;origin:string}>();
  const transitions=new Map<HTMLElement,string>();
  let frame=0;
  const restore=()=>{saved.forEach((s,el)=>{el.style.transform=s.transform;el.style.transformOrigin=s.origin;});saved.clear();};
  const paint=()=>{
   restore();
   const outer=presentation?.style.transform;
   if(outer)presentation!.style.transform='none';
   try{
    const map=domeContentMap(config,view);
    // Project each scrolling viewport with its contents so its clip edge follows
    // the same surface. Native scrolling stays below the separate collection title.
    const selector='.clothing-collection, .record-collection, .dome-information p > span, [data-glass-text], [data-soul-letter], [data-world-object="planet-heart"], [data-dome-caption], [data-dome-slot="socials"] > a, .dome-information h2, .dome-information h3, .dome-information p, .dome-information input, .dome-information button, .dome-information a';
    const elements=Array.from(node.querySelectorAll<HTMLElement>(selector)).filter(el=>!el.matches('h2,p')||!el.querySelector('[data-glass-text]')); 
    const warning=presentation?.querySelector<HTMLElement>('.rotation-reminder');if(warning)elements.push(warning);
    elements.forEach(el=>{if(!transitions.has(el)){transitions.set(el,el.style.transitionProperty);el.style.transitionProperty='color, background-color, border-color, opacity, filter';}});
    // Read every unwarped box first, then write: avoid repeated layout flushes.
    const patches=elements.filter(el=>!elements.some(parent=>parent!==el&&parent.contains(el))).filter(el=>el.getClientRects().length).map(el=>{
     const rect=el.getBoundingClientRect(),style=getComputedStyle(el),m=new DOMMatrix(style.transform==='none'?undefined:style.transform);
     const [ox,oy]=style.transformOrigin.split(' ').map(parseFloat);
     const base=new DOMMatrix().translate(ox,oy).multiply(m).translate(-ox,-oy);
     const corners=[[0,0],[el.offsetWidth,0],[0,el.offsetHeight],[el.offsetWidth,el.offsetHeight]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(base));
     const left=rect.left-Math.min(...corners.map(p=>p.x)),top=rect.top-Math.min(...corners.map(p=>p.y));
     const x=rect.left+rect.width/2,y=rect.top+rect.height/2,p=map(x,y),a=map(x+.5,y),b=map(x-.5,y),c=map(x,y+.5),d=map(x,y-.5);
     const j=new DOMMatrix([a.x-b.x,a.y-b.y,c.x-d.x,c.y-d.y,0,0]);
     j.e=p.x-j.a*x-j.c*y;j.f=p.y-j.b*x-j.d*y;
     const result=new DOMMatrix().translate(-left,-top).multiply(j).translate(left,top).multiply(base);
     return {el,result};
    });
    patches.forEach(({el,result})=>{saved.set(el,{transform:el.style.transform,origin:el.style.transformOrigin});el.style.transformOrigin='0 0';el.style.transform=result.toString();});
   }finally{if(outer)presentation!.style.transform=outer;}
  };
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(paint);};
  paint();
  const changes=new MutationObserver(schedule);
  changes.observe(node,{childList:true,subtree:true,attributes:true,attributeFilter:['data-dome-menu','hidden','aria-expanded']});
  node.addEventListener('scroll',schedule,true);
  document.fonts?.addEventListener('loadingdone',schedule);
  const resize=new ResizeObserver(schedule);resize.observe(node);
  return()=>{cancelAnimationFrame(frame);changes.disconnect();resize.disconnect();node.removeEventListener('scroll',schedule,true);document.fonts?.removeEventListener('loadingdone',schedule);restore();transitions.forEach((value,el)=>{el.style.transitionProperty=value;});};
 },[root,config,view,active]);
}
