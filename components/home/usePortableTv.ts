"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import { useScopedLifecycle } from './useScopedLifecycle';

/** Two-position movement for the public video TV. */
export function usePortableTv(frame?:{view:{width:number;height:number};angle:number}) {
  const width=frame?.view.width, height=frame?.view.height, angle=frame?.angle ?? 0;
  const lifecycle = useScopedLifecycle();
  const dragCleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => dragCleanup.current?.(), []);
  const tvSide = useRef<"left" | "right">("right");
  const tvRef = useRef<HTMLElement | null>(null);
  const [tvPos, setTvPos] = useState<{ x: number; y: number } | null>(null);
  const [tvExpanded, setTvExpanded] = useState(false);
const clampTvPosition = useCallback((x: number, y: number) => {
  const isMobile = (width ?? window.innerWidth) < 640;
  const tvWidth = tvRef.current?.offsetWidth ?? (isMobile ? Math.min(140, (width ?? window.innerWidth) * 0.35) : 320);
  const tvHeight = tvRef.current?.offsetHeight ?? (isMobile ? 80 : 250);
  const margin = isMobile ? 8 : 12;

  return {
    x: Math.min(Math.max(margin, x), (width ?? window.innerWidth) - tvWidth - margin),
    y: Math.min(Math.max(margin, y), (height ?? window.innerHeight) - tvHeight - margin),
  };
}, [width, height]);
const dragTv = (e: React.PointerEvent<HTMLElement>) => {
  if (tvExpanded) return;

  e.preventDefault();
  e.stopPropagation();

  dragCleanup.current?.();
  const radians=angle*Math.PI/180;
  const localX=(event:{clientX:number;clientY:number})=>event.clientX*Math.cos(radians)+(event.clientY ?? 0)*Math.sin(radians);
  const startX = localX(e);
  
  const threshold = 18;
  let direction: "left" | "right" | null = null;

  const moveTv = (moveEvent: PointerEvent) => {
    const dx = localX(moveEvent) - startX;

    if (dx < -threshold) {
      direction = "left";
    } else if (dx > threshold) {
      direction = "right";
    }
  };

  const stopDragging = () => {
    window.removeEventListener("pointermove", moveTv);
    window.removeEventListener("pointerup", stopDragging);
    window.removeEventListener("pointercancel", cancelDragging);
    dragCleanup.current = null;

    if (!direction || !tvRef.current) return;

    tvSide.current = direction;
    const rect = width===undefined ? tvRef.current.getBoundingClientRect() : {width:tvRef.current.offsetWidth,height:tvRef.current.offsetHeight};
    const margin = (width ?? window.innerWidth) < 640 ? 8 : 26;

    const x =
      direction === "left"
        ? margin
        : (width ?? window.innerWidth) - rect.width - margin;

    const y = (height ?? window.innerHeight) - rect.height - margin;

    setTvPos(clampTvPosition(x, y));
  };

  const cancelDragging = () => {
    window.removeEventListener("pointermove", moveTv);
    window.removeEventListener("pointerup", stopDragging);
    window.removeEventListener("pointercancel", cancelDragging);
  };
  dragCleanup.current = cancelDragging;
  window.addEventListener("pointercancel", cancelDragging);
  window.addEventListener("pointermove", moveTv);
  window.addEventListener("pointerup", stopDragging);
};


const hasPosition = tvPos !== null;

useEffect(() => {

  const placeTv = () => {
    const frame = lifecycle.frame(() => {
      const tv = tvRef.current;
      if (!tv) {
        // Bootstrap the conditional TV mount; this same positioning system
        // measures it after React commits the non-null position.
        const isMobile = (width ?? window.innerWidth) < 640;
        const fallbackWidth = isMobile
          ? Math.min(140, (width ?? window.innerWidth) * 0.35)
          : Math.min(340, (width ?? window.innerWidth) * 0.28);
        const margin = isMobile ? 8 : 26;
        setTvPos({ x: (width ?? window.innerWidth) - fallbackWidth - margin, y: (height ?? window.innerHeight) });
        return;
      }

      const rect = width===undefined ? tv.getBoundingClientRect() : {width:tv.offsetWidth,height:tv.offsetHeight};
      const margin = (width ?? window.innerWidth) < 640 ? 8 : 26;

      const leftX = margin;
      const rightX = (width ?? window.innerWidth) - rect.width - margin;
      const bottomY = (height ?? window.innerHeight) - rect.height - margin;

      setTvPos(clampTvPosition(
        tvSide.current === "left" ? leftX : rightX,
        bottomY
      ));
    });

    return () => lifecycle.cancelFrame(frame);
  };

  const cancelInitialFrame = placeTv();

  const handleResize = () => {
    placeTv();
  };

  window.addEventListener("resize", handleResize);

  return () => {
    cancelInitialFrame?.();
    window.removeEventListener("resize", handleResize);
  };
}, [lifecycle, hasPosition, width, height, clampTvPosition]);


return { tvRef, tvPos, tvExpanded, setTvExpanded, dragTv };
}
