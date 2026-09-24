'use client';
import { useLayoutEffect, useRef, type RefObject } from 'react';
import { domePoint, type DomeConfig, type Viewport } from '@/lib/ship/domeGeometry';
import { domePageLayout, domeSurfaceFrame, wordmarkRulePath } from '@/lib/ship/domePageLayout';
import { mobileSideContent } from '@/lib/ship/mobilePresentation';
import { wordmarkFrames, PLANET_INK } from '@/lib/ship/wordmarkGeometry';
import { measureWordmarkInk, clearWordmarkInkCache } from './measureWordmarkInk';
import { socialProjection, socialIconSize, type SocialRect } from '@/lib/ship/socialProjection';
import { cameraDuration } from '@/lib/ship/cameraTransition';

/** Reposition the real live DOM, never a screenshot, clone or second content tree. */
export function useDomeProjection(root: RefObject<HTMLDivElement | null>, cockpit: boolean, config: DomeConfig, view: Viewport, animateEntry = false, camera = config, progress = cockpit ? 1 : 0, mobileThird=false) {
  const priorMode = useRef(cockpit);
  const mounted = useRef(false);
  const socialOrigins=useRef<{width:number;height:number;rects:SocialRect[];sizes:{width:number;height:number}[]}|null>(null);
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
      const [baseTheta,phi] = positions[name];
      const side=mobileThird && (name==='live' || name==='merch') ? mobileSideContent(name) : null;
      const theta=side?.theta ?? baseTheta;
      const point = domePoint(theta,phi,config,view);
      const width = name === 'brand' ? 340 : name === 'socials' ? 460 : Math.min(350,view.width*(desktop ? .27 : .43));
      const scale = side?.scale ?? (name === 'brand' ? 1.05 : name === 'socials' ? .72 : .78);
      const x=desktop ? point.x : Math.max(width*scale/2+view.width*.04,Math.min(view.width*.96-width*scale/2,point.x));
      Object.assign(el.style,{position:'fixed',left:`${x}px`,top:`${point.y}px`,width:`${width}px`,margin:'0',transformOrigin:'center',transform:`translate(-50%, -50%) scale(${scale})`});
    });
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const duration = cameraDuration(motion.matches,document.hidden);
    const animations = duration > 0 && desktop && !mobileThird && changedMode && cockpit ? slots.map((el,i) => {
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
  }, [root,cockpit,config,view,animateEntry,mobileThird]);
  useLayoutEffect(()=>{
    const node=root.current; if(!node) return;
    const paint=()=>{
    // Read layout in the scene's own coordinates while its outer frame swivels.
    const presentation=node.closest<HTMLElement>('[data-cockpit-presentation]');
    const presentationTransform=presentation?.style.transform;
    if(presentationTransform) presentation!.style.transform='matrix(1,0,0,1,0,0)';
    try {
    const headerParts=Array.from(node.querySelectorAll<HTMLElement>('[data-dome-slot="brand"] h1 > *, [data-dome-slot="brand"] p > [data-dome-caption], [data-dome-slot="socials"] > a'));
    if(!headerParts.length) return;
    const slots=Array.from(node.querySelectorAll<HTMLElement>('[data-dome-slot="brand"], [data-dome-slot="socials"]'));
    // Hover colours may animate; geometry is already driven by camera progress.
    // A second CSS transform transition would corrupt the natural-layout measurement.
    headerParts.forEach(el=>{el.removeAttribute('style');el.style.transitionProperty='color, background-color, border-color';});
    slots.forEach(el=>el.removeAttribute('style'));
    const socialParts=headerParts.filter(el=>el.tagName==='A');
    const icons=socialParts.map(el=>el.querySelector('svg'));
    icons.forEach(svg=>{svg?.style.removeProperty('width');svg?.style.removeProperty('height');});
    node.classList.remove('on-glass');
    const returning=!cockpit && progress>0;
    const sides=Array.from(node.querySelectorAll<HTMLElement>('[data-dome-slot="live"], [data-dome-slot="merch"]'));
    if(!cockpit) sides.forEach(el=>{el.removeAttribute('style');el.querySelector('h2')?.removeAttribute('style');});
    // Measure the complete first-person grid before taking header pieces out of flow.
    const destinations=returning ? sides.map(el=>el.getBoundingClientRect()) : [];
    const slotHeights=returning ? slots.map(el=>el.getBoundingClientRect().height) : [];
    const natural=headerParts.map(el=>el.getBoundingClientRect());
    const surfaceRects=natural;
    // Never feed an intermediate rendered position back into the next frame's origin.
    // Refresh only for a settled public layout, a viewport change or font loading.
    if(!socialOrigins.current || socialOrigins.current.width!==view.width || socialOrigins.current.height!==view.height || progress===0) {
      socialOrigins.current={width:view.width,height:view.height,
        rects:socialParts.map(el=>{const r=natural[headerParts.indexOf(el)];return {left:r.left,top:r.top,width:r.width,height:r.height};}),
        sizes:icons.map(svg=>{const r=svg?.getBoundingClientRect();return {width:r?.width ?? 48,height:r?.height ?? 48};})};
    }
    const origins=socialOrigins.current;
    const wordmark=node.querySelector<HTMLElement>('h1.soul-wordmark');
    const glyphs=Array.from(node.querySelectorAll<HTMLElement>('[data-soul-letter]'));
    const planet=node.querySelector<HTMLElement>('[data-world-object="planet-heart"]');
    const rules=node.querySelector<SVGSVGElement>('[data-dome-rules]');
    if(wordmark && glyphs.length===3 && planet && rules) {
      const rect=wordmark.getBoundingClientRect();
      const centreY=rect.top+rect.height/2;
      const inks=glyphs.map(measureWordmarkInk);
      const frames=wordmarkFrames(inks,parseFloat(getComputedStyle(wordmark).fontSize),centreY,camera,view,progress);
      for(const [i,key] of (['S','U','L'] as const).entries()) {
        const m=[...frames[key]];
        // First person stays in document flow. Projected frames use viewport coordinates.
        if(progress===0){m[4]-=rect.left;m[5]-=rect.top;}
        Object.assign(glyphs[i].style,{position:progress>0?'fixed':'absolute',left:'0',top:'0',width:`${inks[i].width}px`,height:`${inks[i].height}px`,margin:'0',transformOrigin:'0 0',transform:`matrix(${m.join(',')})`});
      }
      const m=[...frames.O];if(progress===0){m[4]-=rect.left;m[5]-=rect.top;}
      planet.style.setProperty('--soul-glow-unit',`${(PLANET_INK.right-PLANET_INK.left)/(frames.planetWidth*Math.hypot(m[0],m[1]))}px`);
      Object.assign(planet.style,{position:progress>0?'fixed':'absolute',left:'0',top:'0',width:`${frames.planetWidth}px`,height:`${frames.planetHeight}px`,margin:'0',transformOrigin:'0 0',transform:`matrix(${m.join(',')})`});
      const brand=node.querySelector<HTMLElement>('[data-dome-slot="brand"]')!.getBoundingClientRect();
      Object.assign(rules.style,{position:progress>0?'fixed':'absolute',left:'0',top:'0',width:`${view.width}px`,height:`${view.height}px`,transform:progress===0?`translate(${-brand.left}px,${-brand.top}px)`:'none'});
      rules.querySelector('path')!.setAttribute('stroke-width',String(4-2*progress));
      rules.querySelector('path')!.setAttribute('d',wordmarkRulePath(camera,view,frames.rules,centreY,progress,!mobileThird));
    }
    node.classList.toggle('on-glass',cockpit);
    const layout=domePageLayout(config);
    // Sample the actual spherical surface separately for every glyph/logo/link.
    // The existing camera progress blends from the unchanged first-person DOM layout.
    if (progress > 0) {
      for (const name of ['brand','socials']) {
        const slot=slots.find(el=>el.dataset.domeSlot===name);
        if(slot) Object.assign(slot.style,{position:'static',transform:'none',width:'auto',...(returning ? {height:`${slotHeights[slots.indexOf(slot)]}px`} : {})});
      }
      const captionRects=headerParts.filter(el=>el.hasAttribute('data-dome-caption')).map(el=>surfaceRects[headerParts.indexOf(el)]);
      const captionLeft=Math.min(...captionRects.map(r=>r.left));
      const captionRight=Math.max(...captionRects.map(r=>r.right));
      headerParts.forEach((el,i)=>{
        if(el.parentElement?.tagName==='H1')return;
        const rect=surfaceRects[i], origin=natural[i]; if(!rect.width || !rect.height) return;
        const social=el.tagName==='A';
        if(social) {
          const index=socialParts.indexOf(el),start=origins.rects[index];
          const matrix=socialProjection(start,index,layout.socials,camera,view,progress);
          Object.assign(el.style,{position:'fixed',left:'0',top:'0',width:`${start.width}px`,height:`${start.height}px`,margin:'0',transformOrigin:'0 0',transform:`matrix(${matrix.join(',')})`});
          const svg=icons[index],size=origins.sizes[index];
          if(svg)Object.assign(svg.style,{width:`${socialIconSize(size.width,view.width<760,progress)}px`,height:`${socialIconSize(size.height,view.width<760,progress)}px`});
          return;
        }
        const theta=social ? (socialParts.indexOf(el)-2)*.26 : ((rect.left+rect.width/2-captionLeft)/(captionRight-captionLeft)-.5)*layout.captionWidth;
        const angularWidth=social ? .14 : rect.width/(captionRight-captionLeft)*layout.captionWidth;
        const phi=social ? layout.socials : layout.caption;
        const [sx,sy,tx,ty,px,py]=domeSurfaceFrame(theta,phi,angularWidth,rect.width,rect.height,camera,view);
        const t=progress;
        const x=origin.left+(px-origin.left)*t, y=origin.top+(py-origin.top)*t;
        const startX=origin.width/rect.width, startY=origin.height/rect.height;
        const ax=startX+(sx-startX)*t, ay=sy*t, bx=tx*t, by=startY+(ty-startY)*t;
        Object.assign(el.style,{position:'fixed',left:'0',top:'0',width:`${rect.width}px`,height:`${rect.height}px`,margin:'0',transformOrigin:'0 0',transform:`matrix(${ax},${ay},${bx},${by},${x},${y})`});
      });
    }
    if(returning) sides.forEach((el,i)=>{
      const dest=destinations[i];
      const tuning=mobileThird ? mobileSideContent(el.dataset.domeSlot!) : null;
      const theta=tuning?.theta ?? (el.dataset.domeSlot==='live' ? -.67 : .67);
      const point=domePoint(theta,layout.information,config,view);
      const desktop=view.width>=760;
      const projectedWidth=Math.min(350,view.width*(desktop ? .27 : .43));
      const scale=tuning?.scale ?? .78;
      const centre=desktop ? point.x : Math.max(projectedWidth*scale/2+view.width*.04,Math.min(view.width*.96-projectedWidth*scale/2,point.x));
      const width=dest.width+(projectedWidth-dest.width)*progress;
      const currentScale=1+(scale-1)*progress;
      // Preserve third-person typography at its endpoint, with no CSS-class snap.
      const heading=el.querySelector<HTMLElement>('h2');
      if(heading){heading.style.fontSize=`${24+(view.width<760 ? -8 : 0)*progress}px`;heading.style.marginBottom=`${16+(view.width<760 ? -8 : 0)*progress}px`;}
      Object.assign(el.style,{position:'fixed',left:'0',top:'0',width:`${width}px`,margin:'0',fontSize:`${16+(view.width<760 ? -4 : 0)*progress}px`,transform:'none',transformOrigin:'0 0'});
      const height=el.getBoundingClientRect().height;
      const x=dest.left+(centre-projectedWidth*scale/2-dest.left)*progress;
      const y=dest.top+(point.y-height*scale/2-dest.top)*progress;
      el.style.transform=`translate(${x}px,${y}px) scale(${currentScale})`;
    });
    if(!cockpit && progress===0) sides.forEach(el=>el.querySelector('h2')?.removeAttribute('style'));
    } finally {
      if(presentationTransform) presentation!.style.transform=presentationTransform;
    }
    };
    paint();
    let cancelled=false,frame=0;
    const fontsChanged=()=>{socialOrigins.current=null;clearWordmarkInkCache();if(!cancelled){cancelAnimationFrame(frame);frame=requestAnimationFrame(paint);}};
    if(document.fonts?.status==='loading')void document.fonts.ready.then(()=>{if(!cancelled)fontsChanged();});
    document.fonts?.addEventListener('loadingdone',fontsChanged);
    return ()=>{cancelled=true;cancelAnimationFrame(frame);document.fonts?.removeEventListener('loadingdone',fontsChanged);};
  },[root,cockpit,config,view,camera,progress,mobileThird]);

}
