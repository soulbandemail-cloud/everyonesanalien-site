'use client';
import { useLayoutEffect, useRef, type RefObject } from 'react';
import { domePoint, type DomeConfig, type Viewport } from '@/lib/ship/domeGeometry';
import { domePageLayout } from '@/lib/ship/domePageLayout';
import { cameraDuration } from '@/lib/ship/cameraTransition';

/** Reposition the real live DOM, never a screenshot, clone or second content tree. */
export function useDomeProjection(root: RefObject<HTMLDivElement | null>, cockpit: boolean, config: DomeConfig, view: Viewport, animateEntry = false) {
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
      mate: [-.67,layout.information], live: [.67,layout.information], merch: [0,layout.merch],
    };
    const desktop = view.width >= 760;
    if (cockpit && desktop) slots.forEach(el => {
      const name = el.dataset.domeSlot!;
      const [theta,phi] = positions[name];
      const point = domePoint(theta,phi,config,view);
      const width = name === 'brand' ? 340 : name === 'socials' ? 460 : Math.min(350,view.width*.27);
      const scale = name === 'brand' ? 1.05 : name === 'socials' ? .72 : .78;
      Object.assign(el.style,{position:'fixed',left:`${point.x}px`,top:`${point.y}px`,width:`${width}px`,margin:'0',transformOrigin:'center',transform:`translate(-50%, -50%) scale(${scale})`});
    });
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const duration = cameraDuration(motion.matches,document.hidden);
    const animations = duration > 0 && desktop && changedMode ? slots.map((el,i) => {
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
}
