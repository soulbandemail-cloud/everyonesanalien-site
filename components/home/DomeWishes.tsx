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

export default function DomeWishes({ active = true, spaceTransform, frame, tapToCatch = false }: { active?: boolean; tapToCatch?:boolean; spaceTransform?: string; frame?:{view:{width:number;height:number};angle:number} }) {
const lifecycle = useScopedLifecycle();
const wishBarrierRef = useRef<WishBarrier | null>(null);
const paddleCleanup = useRef<(() => void) | null>(null);
useEffect(() => () => paddleCleanup.current?.(), []);
const [wishPrompt, setWishPrompt] = useState(false);
const wishInput=useRef<HTMLInputElement>(null);
const [burstOrigin,setBurstOrigin]=useState<{x:number;y:number}|null>(null);
const [wish, setWish] = useState("");
const [wishPoof, setWishPoof] = useState(0);
const [wishRulesKey, setWishRulesKey] = useState(0);
const [pongWish, setPongWish] = useState<{ key: number; x: number } | null>(null);

const catchShootingStar = (e: React.PointerEvent<HTMLSpanElement>) => {
  if (!active) return;
  e.preventDefault();
  e.stopPropagation();

  setWish("");
  setWishPoof(0);
  setWishRulesKey(0);
  setPongWish(null);
  wishBarrierRef.current = null;
  setWishPrompt(true);
};

// Telescope steering uses the same catch handler, but commits only on a tap.
const starPress=useRef<{x:number;y:number;id:number}|null>(null);
const starDown=(e:React.PointerEvent<HTMLSpanElement>)=>{
 if(!tapToCatch){catchShootingStar(e);return;}
 starPress.current={x:e.clientX,y:e.clientY,id:e.pointerId};
};
const starUp=(e:React.PointerEvent<HTMLSpanElement>)=>{
 const start=starPress.current;starPress.current=null;
 if(tapToCatch&&start&&start.id===e.pointerId&&Math.hypot(e.clientX-start.x,e.clientY-start.y)<7)catchShootingStar(e);
};
const closeWishPrompt = () => {
  const input=wishInput.current,scope=input?.closest<HTMLElement>('.telescope-view');
  if(input&&scope){
    const r=input.getBoundingClientRect(),b=scope.getBoundingClientRect();
    const presentation=scope.closest<HTMLElement>('[data-cockpit-presentation]');
    const angle=Number(presentation?.dataset.presentationAngle??0)*Math.PI/180,scale=Number(presentation?.dataset.presentationScale??1);
    const dx=r.left+r.width/2-b.left-b.width/2,dy=r.top+r.height/2-b.top-b.height/2;
    setBurstOrigin({x:(dx*Math.cos(angle)+dy*Math.sin(angle))/scale+scope.clientWidth/2,y:(-dx*Math.sin(angle)+dy*Math.cos(angle))/scale+scope.clientHeight/2});
  }

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

  const radians=(frame?.angle ?? 0)*Math.PI/180;
  const localX=(event:{clientX:number;clientY:number})=>event.clientX*Math.cos(radians)+(event.clientY ?? 0)*Math.sin(radians);
  const startX = localX(e);
  paddleCleanup.current?.();
  const startOffset = pongWish.x;
  const maxOffset = (frame?.view.width ?? window.innerWidth) / 2 - 40;

  const movePaddle = (moveEvent: PointerEvent) => {
    const nextX = Math.min(
      Math.max(startOffset + localX(moveEvent) - startX, -maxOffset),
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
<div className={`shooting-stars ${active ? "" : "exterior-shooting-inactive"}`} style={{transform:spaceTransform,transformOrigin:"0 0"}}>
  <span className="shooting-star shooting-star-launch" onPointerDown={starDown} onPointerUp={starUp} onPointerCancel={()=>{starPress.current=null;}}></span>
  <span className="shooting-star shooting-star-1" onPointerDown={starDown} onPointerUp={starUp} onPointerCancel={()=>{starPress.current=null;}}></span>
  <span className="shooting-star shooting-star-2" onPointerDown={starDown} onPointerUp={starUp} onPointerCancel={()=>{starPress.current=null;}}></span>
  <span className="shooting-star shooting-star-3" onPointerDown={starDown} onPointerUp={starUp} onPointerCancel={()=>{starPress.current=null;}}></span>
  <span className="shooting-star shooting-star-4" onPointerDown={starDown} onPointerUp={starUp} onPointerCancel={()=>{starPress.current=null;}}></span>
  <span className="shooting-star shooting-star-5" onPointerDown={starDown} onPointerUp={starUp} onPointerCancel={()=>{starPress.current=null;}}></span>
  <span className="shooting-star shooting-star-6" onPointerDown={starDown} onPointerUp={starUp} onPointerCancel={()=>{starPress.current=null;}}></span>
  <span className="shooting-star shooting-star-7" onPointerDown={starDown} onPointerUp={starUp} onPointerCancel={()=>{starPress.current=null;}}></span>
  <span className="shooting-star shooting-star-8" onPointerDown={starDown} onPointerUp={starUp} onPointerCancel={()=>{starPress.current=null;}}></span>
  <span className="shooting-star shooting-star-9" onPointerDown={starDown} onPointerUp={starUp} onPointerCancel={()=>{starPress.current=null;}}></span>
  <span className="shooting-star shooting-star-10" onPointerDown={starDown} onPointerUp={starUp} onPointerCancel={()=>{starPress.current=null;}}></span>
</div>

{active && (wishPrompt || wishPoof > 0 || wishRulesKey > 0) && (
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
          ref={wishInput}
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
          className="pink-border-glow border border-white bg-[#00082d] focus:bg-[#00082d] px-3 py-2 text-white placeholder:text-white/70 outline-none focus:border-white"
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
            "--wish-origin-x":burstOrigin?`${burstOrigin.x}px`:undefined,
            "--wish-origin-y":burstOrigin?`${burstOrigin.y}px`:undefined,
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
