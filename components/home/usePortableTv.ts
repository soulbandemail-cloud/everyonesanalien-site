"use client";
import { useEffect, useRef, useState } from 'react';
import { useScopedLifecycle } from './useScopedLifecycle';

/** Original two-position TV movement, shared by the video TV and arcade bumper. */
export function usePortableTv() {
  const lifecycle = useScopedLifecycle();
  const dragCleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => dragCleanup.current?.(), []);
  const tvRef = useRef<HTMLElement | null>(null);
  const [tvPos, setTvPos] = useState<{ x: number; y: number } | null>(null);
  const [tvExpanded, setTvExpanded] = useState(false);
const clampTvPosition = (x: number, y: number) => {
  const isMobile = window.innerWidth < 640;
  const tvWidth = tvRef.current?.offsetWidth ?? (isMobile ? Math.min(140, window.innerWidth * 0.35) : 320);
  const tvHeight = tvRef.current?.offsetHeight ?? (isMobile ? 80 : 250);
  const margin = isMobile ? 8 : 12;

  return {
    x: Math.min(Math.max(margin, x), window.innerWidth - tvWidth - margin),
    y: Math.min(Math.max(margin, y), window.innerHeight - tvHeight - margin),
  };
};
const dragTv = (e: React.PointerEvent<HTMLElement>) => {
  if (tvExpanded) return;

  e.preventDefault();
  e.stopPropagation();

  dragCleanup.current?.();
  const startX = e.clientX;
  
  const threshold = 18;
  let direction: "left" | "right" | null = null;

  const moveTv = (moveEvent: PointerEvent) => {
    const dx = moveEvent.clientX - startX;

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

    const rect = tvRef.current.getBoundingClientRect();
    const margin = window.innerWidth < 640 ? 8 : 26;

    const x =
      direction === "left"
        ? margin
        : window.innerWidth - rect.width - margin;

    const y = window.innerHeight - rect.height - margin;

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


useEffect(() => {
  const isMobile = window.innerWidth < 640;
  const fallbackWidth = isMobile
    ? Math.min(140, window.innerWidth * 0.35)
    : Math.min(340, window.innerWidth * 0.28);

  const margin = isMobile ? 8 : 26;

  setTvPos({
    x: window.innerWidth - fallbackWidth - margin,
    y: window.innerHeight,
  });
}, []);

useEffect(() => {

  const placeTv = () => {
    const frame = lifecycle.frame(() => {
      const tv = tvRef.current;
      if (!tv) return;

      const rect = tv.getBoundingClientRect();
      const margin = window.innerWidth < 640 ? 8 : 26;

      const leftX = margin;
      const rightX = window.innerWidth - rect.width - margin;
      const bottomY = window.innerHeight - rect.height - margin;

      setTvPos((current) => {
        const side =
          current && current.x < window.innerWidth / 2
            ? "left"
            : "right";

        return clampTvPosition(
          side === "left" ? leftX : rightX,
          bottomY
        );
      });
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
}, [lifecycle]);


return { tvRef, tvPos, tvExpanded, setTvExpanded, dragTv };
}
