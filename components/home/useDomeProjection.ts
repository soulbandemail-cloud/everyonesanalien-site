'use client';
import { useLayoutEffect, useRef, type RefObject } from 'react';
import { domePoint, type DomeConfig, type Viewport } from '@/lib/ship/domeGeometry';
import { domePageLayout, domeSurfaceFrame } from '@/lib/ship/domePageLayout';
import { cameraDuration } from '@/lib/ship/cameraTransition';

/** Reposition the real live DOM, never a screenshot, clone or second content tree. */
export function useDomeProjection(root: RefObject<HTMLDivElement | null>, cockpit: boolean, config: DomeConfig, view: Viewport, animateEntry = false, camera = config, progress = cockpit ? 1 : 0) {
  const priorMode = useRef(cockpit);
  const mounted = useRef(false);
  useLayoutEffect(() => {
    const node = root.current;
    if (!node) return;
    const slots = Array.from(node.querySelectorAll<HTMLElement>('[data-dome-slot]'));
    const changedMode = mounted.current ? priorMode.current !== cockpit : animateEntry;
    mounted.current = true; priorMode.current = cockpit;
    const old = slots.map(el => el.getBoundingClientRect());
    slots.forEach(el => el.removeAttribute('style'));
    node.classList.toggle('on-glass', cockpit);
    const layout = domePageLayout(config);
    const positions: Record<string, [number, number]> = {
      socials: [0,layout.socials], brand: [0,layout.brand],
      mate: [0,layout.information], live: [-.67,layout.information], merch: [.67,layout.information],
    };
    const desktop = view.width >= 760;
    if (cockpit) slots.forEach(el => {
      const name = el.dataset.domeSlot!;
      const [theta,phi] = positions[name];
      const point = domePoint(theta,phi,config,view);
      const width = name === 'brand' ? 340 : name === 'socials' ? 460 : Math.min(350,view.width*(desktop ? .27 : .43));
      const scale = name === 'brand' ? 1.05 : name === 'socials' ? .72 : .78;
      const x=desktop ? point.x : Math.max(width*scale/2+view.width*.04,Math.min(view.width*.96-width*scale/2,point.x));
      Object.assign(el.style,{position:'fixed',left:`${x}px`,top:`${point.y}px`,width:`${width}px`,margin:'0',transformOrigin:'center',transform:`translate(-50%, -50%) scale(${scale})`});
    });
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const duration = cameraDuration(motion.matches,document.hidden);
    const animations = duration > 0 && desktop && changedMode ? slots.map((el,i) => {
      if (['brand','socials'].includes(el.dataset.domeSlot!)) return null;
      const next = el.getBoundingClientRect(), prior = old[i];
      if (!next.width || !prior.width) return null;
      const finalTransform = getComputedStyle(el).transform;
      const dx = prior.x + prior.width/2 - next.x - next.width/2;
      const dy = prior.y + prior.height/2 - next.y - next.height/2;
      return el.animate([
        { transform: `translate(${dx}px,${dy}px) ${finalTransform === 'none' ? '' : finalTransform} scale(${prior.width/next.width},${prior.height/next.height})` },
        { transform: finalTransform },
      ],{duration,easing:'cubic-bezier(.45,0,.2,1)'});
    }) : [];
    const finish = () => animations.forEach(animation=>animation?.cancel());
    const visibility = () => { if(document.hidden) finish(); };
    motion.addEventListener('change',finish);
    document.addEventListener('visibilitychange',visibility);
    window.addEventListener('resize',finish);
    return () => { finish(); motion.removeEventListener('change',finish); document.removeEventListener('visibilitychange',visibility); window.removeEventListener('resize',finish); };
  }, [root,cockpit,config,view,animateEntry]);
  useLayoutEffect(()=>{
    const node=root.current; if(!node) return;
    const headerParts=Array.from(node.querySelectorAll<HTMLElement>('[data-dome-slot="brand"] h1 > *, [data-dome-slot="brand"] p > [data-dome-caption], [data-dome-slot="socials"] > a'));
    if(!headerParts.length) return;
    const slots=Array.from(node.querySelectorAll<HTMLElement>('[data-dome-slot="brand"], [data-dome-slot="socials"]'));
    headerParts.forEach(el=>el.removeAttribute('style'));
    slots.forEach(el=>el.removeAttribute('style'));
    node.classList.remove('on-glass');
    const natural=headerParts.map(el=>el.getBoundingClientRect());
    const surfaceRects=natural;
    node.classList.toggle('on-glass',cockpit || progress>0);
    const layout=domePageLayout(config);
    // Sample the actual spherical surface separately for every glyph/logo/link.
    // The existing camera progress blends from the unchanged first-person DOM layout.
    if (progress > 0) {
      for (const name of ['brand','socials']) {
        const slot=slots.find(el=>el.dataset.domeSlot===name);
        if(slot) Object.assign(slot.style,{position:'static',transform:'none',width:'auto'});
      }
      const letters=headerParts.filter(el=>el.parentElement?.tagName==='H1');
      const letterRects=letters.map(el=>surfaceRects[headerParts.indexOf(el)]);
      const left=Math.min(...letterRects.map(r=>r.left));
      const right=Math.max(...letterRects.map(r=>r.right));
      const captionRects=headerParts.filter(el=>el.hasAttribute('data-dome-caption')).map(el=>surfaceRects[headerParts.indexOf(el)]);
      const captionLeft=Math.min(...captionRects.map(r=>r.left));
      const captionRight=Math.max(...captionRects.map(r=>r.right));
      const socialParts=headerParts.filter(el=>el.tagName==='A');
      headerParts.forEach((el,i)=>{
        const rect=surfaceRects[i], origin=natural[i]; if(!rect.width || !rect.height) return;
        const social=el.tagName==='A', eyebrow=el.hasAttribute('data-dome-caption');
        const theta=social ? (socialParts.indexOf(el)-2)*.26 : eyebrow ? ((rect.left+rect.width/2-captionLeft)/(captionRight-captionLeft)-.5)*layout.captionWidth : ((rect.left+rect.width/2-left)/(right-left)-.5)*layout.wordmarkGap*2;
        const angularWidth=social ? .14 : eyebrow ? rect.width/(captionRight-captionLeft)*layout.captionWidth : rect.width/(right-left)*layout.wordmarkGap*2;
        const phi=social ? layout.socials : eyebrow ? layout.caption : layout.brand;
        const [sx,sy,tx,ty,px,py]=domeSurfaceFrame(theta,phi,angularWidth,rect.width,rect.height,camera,view);
        const t=progress;
        const x=origin.left+(px-origin.left)*t, y=origin.top+(py-origin.top)*t;
        const startX=origin.width/rect.width, startY=origin.height/rect.height;
        const ax=startX+(sx-startX)*t, ay=sy*t, bx=tx*t, by=startY+(ty-startY)*t;
        Object.assign(el.style,{position:'fixed',left:'0',top:'0',width:`${rect.width}px`,height:`${rect.height}px`,margin:'0',transformOrigin:'0 0',transform:`matrix(${ax},${ay},${bx},${by},${x},${y})`});
      });
    }
  },[root,cockpit,config,view,camera,progress]);

}
