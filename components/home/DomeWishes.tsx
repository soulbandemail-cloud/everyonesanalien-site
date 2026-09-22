"use client";
import { useEffect, useRef, useState } from 'react';
import { useScopedLifecycle } from './useScopedLifecycle';
import WishRules from './WishRules';
import type { WishBarrier } from './wishPhysics';
import './wishes.css';

const WISH_BURST_DURATION = 900;
const WISH_RULE_DURATION = 8000;
const WISH_STAR_OFFSETS = [-120, -92, -66, -38, -14, 14, 38, 66, 92, 120];
const PONG_STAR_OFFSETS = [-120, -92, -66, -38, -14];
const PONG_PADDLE_CENTER_OFFSET = -67;
const WISH_RULE_TRIGGERS = [
  /another\s+wish/,
  /more\s+wishes/,
  /infinite\s+wishes/,
  /\bkill\b/,
  /\bdead\b/,
  /\bdie\b/,
  /\bdeath\b/,
  /back\s+to\s+life/,
  /fall\s+in\s+love/,
];

export default function DomeWishes() {
const lifecycle = useScopedLifecycle();
const wishBarrierRef = useRef<WishBarrier | null>(null);
const paddleCleanup = useRef<(() => void) | null>(null);
useEffect(() => () => paddleCleanup.current?.(), []);
const [wishPrompt, setWishPrompt] = useState(false);
const [wish, setWish] = useState("");
const [wishPoof, setWishPoof] = useState(0);
const [wishRulesKey, setWishRulesKey] = useState(0);
const [pongWish, setPongWish] = useState<{ key: number; x: number } | null>(null);

const catchShootingStar = (e: React.PointerEvent<HTMLSpanElement>) => {
  e.preventDefault();
  e.stopPropagation();

  setWish("");
  setWishPoof(0);
  setWishRulesKey(0);
  setPongWish(null);
  wishBarrierRef.current = null;
  setWishPrompt(true);
};

const closeWishPrompt = () => {
  const key = Date.now();
  const wishcode = wish.trim().toLowerCase();
  const isPongWish = wishcode === "pong";
  const isRulesWish = WISH_RULE_TRIGGERS.some((trigger) =>
    trigger.test(wishcode)
  );

  setWishPrompt(false);

  if (isRulesWish) {
    setWishPoof(0);
    setPongWish(null);
    setWishRulesKey(key);
    wishBarrierRef.current = null;

    lifecycle.timeout(() => {
      setWishRulesKey((current) => (current === key ? 0 : current));
    }, WISH_RULE_DURATION);

    return;
  }

  setWishRulesKey(0);
  setWishPoof(key);
  setPongWish(isPongWish ? { key, x: 0 } : null);
  wishBarrierRef.current = {
    key,
    activeUntil: isPongWish ? Number.POSITIVE_INFINITY : key + WISH_BURST_DURATION,
    xOffset: 0,
    starOffsets: isPongWish ? PONG_STAR_OFFSETS : WISH_STAR_OFFSETS,
  };

  if (isPongWish) {
    return;
  }

  lifecycle.timeout(() => {
    setWishPoof((current) => (current === key ? 0 : current));

    if (wishBarrierRef.current?.key === key) {
      wishBarrierRef.current = null;
    }
  }, WISH_BURST_DURATION);
};


const dragWishPaddle = (e: React.PointerEvent<HTMLDivElement>) => {
  if (!pongWish) return;

  e.preventDefault();
  e.stopPropagation();

  const startX = e.clientX;
  paddleCleanup.current?.();
  const startOffset = pongWish.x;
  const maxOffset = window.innerWidth / 2 - 40;

  const movePaddle = (moveEvent: PointerEvent) => {
    const nextX = Math.min(
      Math.max(startOffset + moveEvent.clientX - startX, -maxOffset),
      maxOffset
    );

    wishBarrierRef.current = wishBarrierRef.current
      ? { ...wishBarrierRef.current, xOffset: nextX }
      : null;
    setPongWish((current) => (current ? { ...current, x: nextX } : current));
  };

  const stopDragging = () => {
    window.removeEventListener("pointermove", movePaddle);
    window.removeEventListener("pointerup", stopDragging);
    window.removeEventListener("pointercancel", stopDragging);
    paddleCleanup.current = null;
  };

  paddleCleanup.current = stopDragging;
  window.addEventListener("pointercancel", stopDragging);
  window.addEventListener("pointermove", movePaddle);
  window.addEventListener("pointerup", stopDragging);
};

return <>
<div className="shooting-stars">
  <span className="shooting-star shooting-star-launch" onPointerDown={catchShootingStar}></span>
  <span className="shooting-star shooting-star-1" onPointerDown={catchShootingStar}></span>
  <span className="shooting-star shooting-star-2" onPointerDown={catchShootingStar}></span>
  <span className="shooting-star shooting-star-3" onPointerDown={catchShootingStar}></span>
  <span className="shooting-star shooting-star-4" onPointerDown={catchShootingStar}></span>
  <span className="shooting-star shooting-star-5" onPointerDown={catchShootingStar}></span>
  <span className="shooting-star shooting-star-6" onPointerDown={catchShootingStar}></span>
  <span className="shooting-star shooting-star-7" onPointerDown={catchShootingStar}></span>
  <span className="shooting-star shooting-star-8" onPointerDown={catchShootingStar}></span>
  <span className="shooting-star shooting-star-9" onPointerDown={catchShootingStar}></span>
  <span className="shooting-star shooting-star-10" onPointerDown={catchShootingStar}></span>
</div>

{(wishPrompt || wishPoof > 0 || wishRulesKey > 0) && (
  <div className={`relative flex min-h-[72px] justify-center ${wishRulesKey > 0 ? "mb-4" : "mb-0"}`}>
    {wishPrompt && (
      <form
        className="wish-box"
        onSubmit={(e) => {
          e.preventDefault();
          closeWishPrompt();
        }}
      >
        <input
          value={wish}
          onChange={(e) => setWish(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              closeWishPrompt();
            }
          }}
          placeholder="MAKE A WISH!"
          autoFocus
          className="pink-border-glow border border-white bg-[#00082d] focus:bg-[#00082d] px-3 py-2 text-white placeholder:text-white/70 outline-none focus:border-[#7fffd4]"
        />
      </form>
    )}

    {wishRulesKey > 0 && <WishRules key={wishRulesKey} />}

    {wishPoof > 0 && (
      <div
        key={wishPoof}
        className={`wish-burst-layer ${pongWish ? "wish-pong-layer" : ""}`}
        style={
          {
            "--wish-paddle-x": `${pongWish?.x ?? 0}px`,
            "--wish-paddle-center-x": `${pongWish ? PONG_PADDLE_CENTER_OFFSET : 0}px`,
          } as React.CSSProperties
        }
      >
        {pongWish && (
          <div
            className="wish-pong-handle"
            onPointerDown={dragWishPaddle}
            aria-hidden="true"
          />
        )}
        {(pongWish ? PONG_STAR_OFFSETS : WISH_STAR_OFFSETS).map((x, i) => (
          <span
            key={i}
            className={`wish-burst-star ${pongWish ? "wish-pong-star" : ""}`}
            style={
              {
                "--burst-x": `${x}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    )}
  </div>
)}

</>;
}
