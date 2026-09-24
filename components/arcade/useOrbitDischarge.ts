import { arcadePoint, arcadeRect } from './presentation';
import { useEffect, useEffectEvent, useRef, useState, type RefObject } from 'react';
import { Discharge, renderedOrbitAngle, type Point } from './discharge';

/** Reads the existing CSS orbit without replacing its animation or the shared heart asset. */
export function useOrbitDischarge(root: RefObject<HTMLDivElement | null>, anchor: RefObject<HTMLSpanElement | null>, orbiting: RefObject<boolean>, onFull: () => void) {
  const [engine] = useState(() => new Discharge());
  const [display, setDisplay] = useState<{charge:number; points:Point[]}>({charge:0,points:[]});
  const headWidth = useRef(32);
  const pointerTarget = useRef<Element | null>(null);

  const update = useEffectEvent(() => {
    const body = root.current?.querySelector('.footer-alien-head');
    const measured = body ? arcadeRect(root.current,body).width : undefined;
    if (measured && measured>0) headWidth.current=measured;
    const ship = anchor.current?.querySelector('.ufo-on-orbit');
    const animation = ship?.getAnimations().find(a => 'animationName' in a && a.animationName==='ufo-orbit-path');
    const timing = animation?.effect?.getComputedTiming();
    if (orbiting.current && ship && animation && timing?.progress != null && timing.currentIteration != null && anchor.current) {
      const angle=renderedOrbitAngle(timing.currentIteration,timing.progress,arcadeRect(root.current,ship),arcadeRect(root.current,anchor.current));
      if(engine.sampleOrbit(animation,angle)) onFull();
    } else engine.sampleOrbit(null,null);
    const activePointer = engine.drawing?.pointerId;
    engine.draw(performance.now());
    if (activePointer !== undefined && !engine.drawing) {
      const target = pointerTarget.current;
      pointerTarget.current = null;
      if (target?.hasPointerCapture(activePointer)) target.releasePointerCapture(activePointer);
    }
    setDisplay(current => current.charge===engine.charge && !engine.drawing && current.points.length===0 ? current : {charge:engine.charge,points:engine.drawing?.points ?? []});
  });

  const end = useEffectEvent((id?:number) => {
    const drawing=engine.drawing;
    if (!drawing || (id!==undefined && drawing.pointerId!==id)) return;
    engine.end(id);
    const target=pointerTarget.current;
    pointerTarget.current=null;
    if(target?.hasPointerCapture(drawing.pointerId)) target.releasePointerCapture(drawing.pointerId);
    setDisplay({charge:engine.charge,points:[]});
  });

  useEffect(() => {
    const surface=root.current;
    if(!surface) return;
    const down=(e:PointerEvent) => {
      if(e.button!==0 || !e.isPrimary || engine.drawing) return;
      const target=e.target as Element;
      if(target.closest('button,a,input,select,textarea,h1,p,svg,[data-arcade-controls],[data-no-zap]')) return;
      update();
      if(!engine.begin(e.pointerId,arcadePoint(root.current,{x:e.clientX,y:e.clientY}),headWidth.current)) return;
      e.preventDefault();
      pointerTarget.current=surface;
      surface.setPointerCapture(e.pointerId);
    };
    const move=(e:PointerEvent) => {
      if(engine.drawing?.pointerId!==e.pointerId) return;
      e.preventDefault();
      update(); // Settle orbital movement against the previous pointer target first.
      engine.aim(e.pointerId,arcadePoint(root.current,{x:e.clientX,y:e.clientY}));
      update();
    };
    const up=(e:PointerEvent) => {
      if(engine.drawing?.pointerId!==e.pointerId) return;
      update();engine.aim(e.pointerId,arcadePoint(root.current,{x:e.clientX,y:e.clientY}));update();end(e.pointerId);
    };
    const cancel=(e:PointerEvent)=>end(e.pointerId);
    const blur=()=>end();
    surface.addEventListener('pointerdown',down);
    surface.addEventListener('lostpointercapture',cancel);
    window.addEventListener('pointermove',move,{passive:false});
    window.addEventListener('pointerup',up);
    window.addEventListener('pointercancel',cancel);
    window.addEventListener('blur',blur);
    let frame=0;
    const tick=()=>{update();frame=window.requestAnimationFrame(tick);};
    frame=window.requestAnimationFrame(tick);
    return ()=>{
      window.cancelAnimationFrame(frame);
      surface.removeEventListener('pointerdown',down);surface.removeEventListener('lostpointercapture',cancel);
      window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',cancel);window.removeEventListener('blur',blur);
      const drawing=engine.drawing;engine.end();
      if(drawing && surface.hasPointerCapture(drawing.pointerId)) surface.releasePointerCapture(drawing.pointerId);
      pointerTarget.current=null;
    };
  },[engine,root]);
  return {engine,display,headWidth};
}
