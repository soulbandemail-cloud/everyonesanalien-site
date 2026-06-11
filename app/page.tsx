"use client";

import { useEffect, useRef, useState } from "react";

import {
  FaInstagram,
  FaSpotify,
  FaTiktok,
  FaYoutube,
  FaEnvelope,
} from "react-icons/fa";

const ZAP_STUN_DURATION = 3000;
const ZAP_RECATCH_COOLDOWN = 700;
const WISH_BURST_DURATION = 900;
const WISH_RULE_DURATION = 8000;
const WISH_BOUNCE_COOLDOWN = 140;
const FOOTER_BOUNCE_COOLDOWN = 140;
const WISH_STAR_OFFSETS = [-120, -92, -66, -38, -14, 14, 38, 66, 92, 120];
const PONG_STAR_OFFSETS = [-120, -92, -66, -38, -14];
const PONG_PADDLE_CENTER_OFFSET = -67;
const WISH_STAR_HIT_PADDING = 18;
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

type WishBarrier = {
  key: number;
  activeUntil: number;
  xOffset: number;
  starOffsets: number[];
};

type FlyingAlien = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number;
  isSkull?: boolean;
  isBlackSkull?: boolean;
  turningBlack?: boolean;
  stunnedUntil?: number;
  lastSparkCatch?: number;
  needsSparkExit?: boolean;
  lastWishBounce?: number;
  lastFooterBounce?: number;
};

export default function Home() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "already" | "error"
  >("idle");
  const tvRef = useRef<HTMLElement | null>(null);
  const antennaRef = useRef<HTMLSpanElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const tvSparkActiveRef = useRef(false);
  const tvSparkTimeoutRef = useRef<number | null>(null);
  const hideWishLayerTimeoutRef = useRef<number | null>(null);
  const wishLayerReturnTimeoutRef = useRef<number | null>(null);
  const womboComboTimeoutRef = useRef<number | null>(null);
  const heartPulseTimeoutRef = useRef<number | null>(null);
  const ufoSpiralActiveRef = useRef(false);
  const wishBarrierRef = useRef<WishBarrier | null>(null);
  const [tvPos, setTvPos] = useState<{ x: number; y: number } | null>(null);
  const [tvExpanded, setTvExpanded] = useState(false);
  const [tvStarted, setTvStarted] = useState(false);
  const [tvSpark, setTvSpark] = useState(false);
  const [tvSparkBurst, setTvSparkBurst] = useState(0);
  const [flashbang, setFlashbang] = useState<{
    key: number;
    type: "white" | "black";
  } | null>(null);
  const [hideWishLayerForFlash, setHideWishLayerForFlash] = useState(false);
  const [slowWishLayerReturn, setSlowWishLayerReturn] = useState(false);
  const [womboComboKey, setWomboComboKey] = useState(0);
  const [ufoSpiral, setUfoSpiral] = useState<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    spin: number;
    key: number;
  } | null>(null);
  const [ufoPos, setUfoPos] = useState({ x: -100, y: -100 });
  const [hideCursorUfo, setHideCursorUfo] = useState(false);
  const [ringBlinking, setRingBlinking] = useState(false);

  const [flyingAliens, setFlyingAliens] = useState<FlyingAlien[]>([]);

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

    setTimeout(() => {
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

  setTimeout(() => {
    setWishPoof((current) => (current === key ? 0 : current));

    if (wishBarrierRef.current?.key === key) {
      wishBarrierRef.current = null;
    }
  }, WISH_BURST_DURATION);
};


const orbitRef = useRef<HTMLSpanElement | null>(null);
  const ufoOrbitingRef = useRef(false);
  const [ufoOrbiting, setUfoOrbiting] = useState(false);
  const [heartPulseKey, setHeartPulseKey] = useState(0);
  const [heartPulse, setHeartPulse] = useState({
  x: -100,
  y: -100,
  key: 0,
});
const toggleUfoOrbit = () => {
  setUfoOrbiting((orbiting) => {
    const nextOrbiting = !orbiting;

    ufoOrbitingRef.current = nextOrbiting;

    return nextOrbiting;
  });
};

const triggerWomboCombo = (key: number) => {
  setWomboComboKey(key);

  if (womboComboTimeoutRef.current) {
    window.clearTimeout(womboComboTimeoutRef.current);
  }

  womboComboTimeoutRef.current = window.setTimeout(() => {
    setWomboComboKey((current) => (current === key ? 0 : current));
    womboComboTimeoutRef.current = null;
  }, 1700);
};

const triggerUfoSpiral = (x: number, y: number, key: number) => {
  if (ufoSpiralActiveRef.current) return;

  ufoSpiralActiveRef.current = true;
  setUfoSpiral({
    x,
    y,
    vx: -3.4,
    vy: 6.2,
    spin: -1,
    key,
  });
};

const triggerHeartPulse = (x: number, y: number, key: number) => {
  setHeartPulse({ x, y, key });

  if (heartPulseTimeoutRef.current) {
    window.clearTimeout(heartPulseTimeoutRef.current);
  }

  heartPulseTimeoutRef.current = window.setTimeout(() => {
    setHeartPulse((current) =>
      current.key === key ? { x: -100, y: -100, key: 0 } : current
    );
    heartPulseTimeoutRef.current = null;
  }, 3000);
};

const triggerFlashbang = (key: number, type: "white" | "black") => {
  setSlowWishLayerReturn(false);
  setHideWishLayerForFlash(true);

  if (hideWishLayerTimeoutRef.current) {
    window.clearTimeout(hideWishLayerTimeoutRef.current);
  }

  if (wishLayerReturnTimeoutRef.current) {
    window.clearTimeout(wishLayerReturnTimeoutRef.current);
  }

  hideWishLayerTimeoutRef.current = window.setTimeout(() => {
    if (type === "black") {
      setSlowWishLayerReturn(true);

      wishLayerReturnTimeoutRef.current = window.setTimeout(() => {
        setSlowWishLayerReturn(false);
        wishLayerReturnTimeoutRef.current = null;
      }, 2000);
    }

    setHideWishLayerForFlash(false);
    hideWishLayerTimeoutRef.current = null;
  }, 500);

  setFlashbang({ key, type });
};

const launchAlien = (e: React.PointerEvent<SVGSVGElement>) => {
  e.preventDefault();
  e.stopPropagation();

  const rect = e.currentTarget.getBoundingClientRect();
  const angle = Math.random() * Math.PI * 2;
  const speed = 5 + Math.random() * 4;

  setFlyingAliens((aliens) => [
    ...aliens,
    {
      id: Date.now() + Math.random(),
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      spin: Math.random() > 0.5 ? 1 : -1,
    },
  ]);
};

const clampTvPosition = (x: number, y: number) => {
  const isMobile = window.innerWidth < 640;
  const tvWidth = tvRef.current?.offsetWidth ?? (isMobile ? Math.min(140, window.innerWidth * 0.35) : 320);
  const tvHeight = tvRef.current?.offsetHeight ?? (isMobile ? 80 : 250);
  const margin = isMobile ? 8 : 12;

  return {
    x: Math.min(Math.max(margin, x), window.innerWidth - tvWidth - margin),
    y: Math.min(Math.max(margin, y), window.innerHeight - tvHeight - 70),
  };
};

const dragTv = (e: React.PointerEvent<HTMLElement>) => {
  if (tvExpanded) return;
  if ((e.target as HTMLElement).closest("button")) return;
  if ((e.target as HTMLElement).closest(".space-tv-screen")) return;

  e.preventDefault();
  e.stopPropagation();

  const startX = e.clientX;
  const startY = e.clientY;
  const startPos = tvPos ?? clampTvPosition(window.innerWidth - 340, window.innerHeight - 320);

  const moveTv = (moveEvent: PointerEvent) => {
    setTvPos(
      clampTvPosition(
        startPos.x + moveEvent.clientX - startX,
        startPos.y + moveEvent.clientY - startY
      )
    );
  };

  const stopDragging = () => {
    window.removeEventListener("pointermove", moveTv);
    window.removeEventListener("pointerup", stopDragging);
  };

  window.addEventListener("pointermove", moveTv);
  window.addEventListener("pointerup", stopDragging);
};

const activateTvSpark = (duration = 500, burst = false) => {
  tvSparkActiveRef.current = true;
  setTvSpark(true);

  if (burst) {
    setTvSparkBurst(Date.now());
  }

  if (tvSparkTimeoutRef.current) {
    window.clearTimeout(tvSparkTimeoutRef.current);
  }

  tvSparkTimeoutRef.current = window.setTimeout(() => {
    tvSparkActiveRef.current = false;
    setTvSpark(false);
    setTvSparkBurst(0);
    tvSparkTimeoutRef.current = null;
  }, duration);
};

const getAntennaCircuitPoint = () => {
  const rect = antennaRef.current?.getBoundingClientRect();

  if (!rect) return null;

  const tipY = window.innerWidth < 640 ? 5 : 5;

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + tipY,
  };
};

const reflectAlienOffWishStars = (
  alien: FlyingAlien,
  next: FlyingAlien,
  now: number
) => {
  const barrier = wishBarrierRef.current;

  if (
    !barrier ||
    now > barrier.activeUntil ||
    now - (alien.lastWishBounce ?? 0) < WISH_BOUNCE_COOLDOWN
  ) {
    return next;
  }

  const starY = window.innerHeight * (window.innerWidth < 640 ? 0.24 : 0.34);
  const minX =
    window.innerWidth / 2 +
    barrier.xOffset +
    Math.min(...barrier.starOffsets) -
    WISH_STAR_HIT_PADDING;
  const maxX =
    window.innerWidth / 2 +
    barrier.xOffset +
    Math.max(...barrier.starOffsets) +
    WISH_STAR_HIT_PADDING;
  const crossedStars =
    (alien.y <= starY && next.y >= starY) ||
    (alien.y >= starY && next.y <= starY);

  if (!crossedStars || alien.vy === 0) {
    return next;
  }

  const travelY = next.y - alien.y;
  const progress = travelY === 0 ? 0 : (starY - alien.y) / travelY;
  const hitX = alien.x + (next.x - alien.x) * progress;

  if (hitX < minX || hitX > maxX) {
    return next;
  }

  return {
    ...next,
    x: hitX + alien.vx * Math.max(0, 1 - progress),
    y: starY - Math.sign(alien.vy) * 18,
    vy: -alien.vy,
    lastWishBounce: now,
  };
};

const reflectAlienOffFooterLine = (
  alien: FlyingAlien,
  next: FlyingAlien,
  now: number
) => {
  const footerTop = footerRef.current?.getBoundingClientRect().top;

  if (
    footerTop === undefined ||
    alien.vy <= 0 ||
    now - (alien.lastFooterBounce ?? 0) < FOOTER_BOUNCE_COOLDOWN
  ) {
    return next;
  }

  const crossedFooterTop = alien.y <= footerTop && next.y >= footerTop;

  if (!crossedFooterTop) {
    return next;
  }

  const travelY = next.y - alien.y;
  const progress = travelY === 0 ? 0 : (footerTop - alien.y) / travelY;
  const hitX = alien.x + (next.x - alien.x) * progress;

  return {
    ...next,
    x: hitX + alien.vx * Math.max(0, 1 - progress),
    y: footerTop - 18,
    vy: -alien.vy,
    lastFooterBounce: now,
  };
};

const dragWishPaddle = (e: React.PointerEvent<HTMLDivElement>) => {
  if (!pongWish) return;

  e.preventDefault();
  e.stopPropagation();

  const startX = e.clientX;
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
  };

  window.addEventListener("pointermove", movePaddle);
  window.addEventListener("pointerup", stopDragging);
};

const sparkTvAntenna = (e: React.PointerEvent<HTMLSpanElement>) => {
  e.preventDefault();
  e.stopPropagation();

  activateTvSpark();
};

  useEffect(() => {
  const moveUfo = (e: PointerEvent) => {
    setUfoPos({
      x: e.clientX,
      y: e.clientY,
    });
  };

  window.addEventListener("pointermove", moveUfo);
  window.addEventListener("pointerdown", moveUfo);

  return () => {
    window.removeEventListener("pointermove", moveUfo);
    window.removeEventListener("pointerdown", moveUfo);
  };
}, []);

useEffect(() => {
  const respawnUfo = (e: PointerEvent) => {
    if (!hideCursorUfo) return;

    setUfoPos({
      x: e.clientX,
      y: e.clientY,
    });

    setHideCursorUfo(false);
  };

  window.addEventListener("pointerdown", respawnUfo);

  return () => {
    window.removeEventListener("pointerdown", respawnUfo);
  };
}, [hideCursorUfo]);

useEffect(() => {
  const placeTv = () => {
    setTvPos((current) => {
      const isMobile = window.innerWidth < 640;
      const fallbackWidth = isMobile ? Math.min(140, window.innerWidth * 0.35) : Math.min(360, window.innerWidth * 0.84);
      const fallbackHeight = isMobile ? 92 : 250;
      const fallbackX = window.innerWidth - fallbackWidth - (isMobile ? 8 : 26);
      const fallbackY = isMobile ? window.innerHeight - fallbackHeight - 108 : window.innerHeight - 380;

      return clampTvPosition(current?.x ?? fallbackX, current?.y ?? fallbackY);
    });
  };

  placeTv();
  window.addEventListener("resize", placeTv);

  return () => {
    window.removeEventListener("resize", placeTv);
  };
}, []);

useEffect(() => {
  return () => {
    if (tvSparkTimeoutRef.current) {
      window.clearTimeout(tvSparkTimeoutRef.current);
    }

    if (hideWishLayerTimeoutRef.current) {
      window.clearTimeout(hideWishLayerTimeoutRef.current);
    }

    if (wishLayerReturnTimeoutRef.current) {
      window.clearTimeout(wishLayerReturnTimeoutRef.current);
    }

    if (womboComboTimeoutRef.current) {
      window.clearTimeout(womboComboTimeoutRef.current);
    }

    if (heartPulseTimeoutRef.current) {
      window.clearTimeout(heartPulseTimeoutRef.current);
    }

    ufoSpiralActiveRef.current = false;
  };
}, []);

useEffect(() => {
  if (!flashbang) return;

  const clearFlashTimeout = window.setTimeout(() => {
    setFlashbang(null);
  }, 2800);

  return () => {
    window.clearTimeout(clearFlashTimeout);
  };
}, [flashbang]);

useEffect(() => {
  const interval = window.setInterval(() => {
    setUfoSpiral((current) => {
      if (!current) return current;

      const next = {
        ...current,
        x: current.x + current.vx,
        y: current.y + current.vy,
      };
      const offscreen =
        next.x < -80 ||
        next.x > window.innerWidth + 80 ||
        next.y < -80 ||
        next.y > window.innerHeight + 80;

      if (offscreen) {
        ufoSpiralActiveRef.current = false;
        return null;
      }

      return next;
    });

    setFlyingAliens((aliens) => {
      if (!orbitRef.current) return aliens;

      const rect = orbitRef.current.getBoundingClientRect();
      const heartX = rect.left + rect.width / 2;
      const heartY = rect.top + rect.height / 2;
      const sparkPoint = tvSparkActiveRef.current ? getAntennaCircuitPoint() : null;
      const sparkX = sparkPoint?.x ?? 0;
      const sparkY = sparkPoint?.y ?? 0;
      const sparkRadius = window.innerWidth < 640 ? 26 : 38;
      const now = Date.now();

      return aliens
        .map((alien) => {
          if (alien.stunnedUntil && now < alien.stunnedUntil) {
            const circuitPoint = getAntennaCircuitPoint();

            return circuitPoint
              ? { ...alien, x: circuitPoint.x, y: circuitPoint.y }
              : alien;
          }

          const activeAlien =
            alien.stunnedUntil && now >= alien.stunnedUntil
              ? {
                  ...alien,
                  isBlackSkull: alien.turningBlack ? true : alien.isBlackSkull,
                  turningBlack: undefined,
                  stunnedUntil: undefined,
                }
              : alien;

          let next = {
            ...activeAlien,
            x: activeAlien.x + activeAlien.vx,
            y: activeAlien.y + activeAlien.vy,
          };

          next = reflectAlienOffWishStars(activeAlien, next, now);
          next = reflectAlienOffFooterLine(activeAlien, next, now);

          const nearSpark = Boolean(
            sparkPoint &&
              Math.hypot(next.x - sparkX, next.y - sparkY) < sparkRadius
          );
          const needsSparkExit = Boolean(activeAlien.needsSparkExit && sparkPoint && nearSpark);

          if (activeAlien.needsSparkExit !== needsSparkExit) {
            next = { ...next, needsSparkExit };
          }

          const hitSpark =
            sparkPoint &&
            !activeAlien.stunnedUntil &&
            !needsSparkExit &&
            now - (activeAlien.lastSparkCatch ?? 0) > ZAP_RECATCH_COOLDOWN &&
            nearSpark;

          if (hitSpark) {
            const stunnedUntil = now + ZAP_STUN_DURATION;

            activateTvSpark(ZAP_STUN_DURATION, true);

            return {
              ...next,
              x: sparkX,
              y: sparkY,
              isSkull: true,
              isBlackSkull: next.isSkull ? false : next.isBlackSkull,
              turningBlack: next.isSkull || next.isBlackSkull,
              stunnedUntil,
              lastSparkCatch: now,
              needsSparkExit: true,
            };
          }

          const hitHeart = Math.hypot(next.x - heartX, next.y - heartY) < 42;

          if (hitHeart) {
            if (next.isBlackSkull) {
              const key = Date.now();
              const wasUfoOrbiting = ufoOrbitingRef.current;

              setRingBlinking(true);
              if (wasUfoOrbiting) {
                ufoOrbitingRef.current = false;
                setUfoOrbiting(false);
                setHideCursorUfo(true);
              }
              triggerFlashbang(key, "black");
              triggerWomboCombo(key);
              triggerHeartPulse(heartX, heartY, key);

              window.setTimeout(() => {
                setRingBlinking(false);
              }, 420);

              return null;
            }

            if (next.isSkull) {
              const key = Date.now();

              setRingBlinking(true);
              ufoOrbitingRef.current = false;
              setUfoOrbiting(false);
              setHideCursorUfo(true);
              triggerFlashbang(key, "white");
              triggerHeartPulse(heartX, heartY, key);

              window.setTimeout(() => {
                setRingBlinking(false);
              }, 420);

              return null;
            }

            const key = Date.now();
            const wasUfoOrbiting = ufoOrbitingRef.current;

            setRingBlinking(true);
            ufoOrbitingRef.current = false;
            setUfoOrbiting(false);
            setHideCursorUfo(true);
            if (wasUfoOrbiting) {
              triggerUfoSpiral(heartX, heartY, key);
            }
            triggerHeartPulse(heartX, heartY, key);

            window.setTimeout(() => {
              setRingBlinking(false);
            }, 420);

            return null;
          }

          const offscreen =
            next.x < -80 ||
            next.x > window.innerWidth + 80 ||
            next.y < -80 ||
            next.y > window.innerHeight + 80;

          return offscreen ? null : next;
        })
        .filter((alien): alien is FlyingAlien => alien !== null);
    });
  }, 16);

  return () => window.clearInterval(interval);
}, []);

return (
  <>
    <div
      className={`fixed z-[9999] pointer-events-none ${
        ufoOrbiting || hideCursorUfo ? "opacity-0" : "opacity-100"
      } transition-opacity duration-300`}
      style={{
        left: `${ufoPos.x}px`,
        top: `${ufoPos.y}px`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <svg viewBox="0 0 120 80" className="pink-svg-glow w-10 h-10 opacity-95">
        <ellipse cx="60" cy="42" rx="42" ry="12" fill="#ffffff" />

        <ellipse
          cx="60"
          cy="35"
          rx="22"
          ry="17"
          fill="none"
          stroke="#ffffff"
          strokeWidth="5"
        />

        <circle cx="38" cy="44" r="3" fill="black" />
        <circle cx="60" cy="46" r="3" fill="black" />
        <circle cx="82" cy="44" r="3" fill="black" />

        <path
          d="M46 56 L34 74"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M60 58 L60 78"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.4"
        />
        <path
          d="M74 56 L86 74"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.55"
        />
      </svg>
    </div>

{flyingAliens.map((alien) => (
  <svg
    key={alien.id}
    viewBox="0 0 100 100"
    className={`fixed z-[9998] pointer-events-none w-8 h-8 flying-alien-head ${
      alien.isSkull ? "flying-alien-skull" : ""
    } ${
      alien.isBlackSkull ? "flying-alien-black-skull" : ""
    } ${
      alien.turningBlack ? "flying-alien-turning-black" : ""
    } ${
      alien.stunnedUntil ? "flying-alien-zapped" : ""
    }`}
    style={
      {
        left: `${alien.x}px`,
        top: `${alien.y}px`,
        "--spin": `${alien.spin}`,
      } as React.CSSProperties
    }
  >
    {alien.isSkull ? (
      <>
        <path
          className="flying-alien-skull-fill"
          d="
            M50 10
            C27 10 15 30 18 52
            C21 75 38 90 50 90
            C62 90 79 75 82 52
            C85 30 73 10 50 10
            Z
          "
        />
        <ellipse cx="36" cy="45" rx="9" ry="13" fill="black" transform="rotate(-14 36 45)" />
        <ellipse cx="64" cy="45" rx="9" ry="13" fill="black" transform="rotate(14 64 45)" />
        <path
          d="M41 68 H59"
          stroke="black"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M45 63 V76 M50 62 V78 M55 63 V76"
          stroke="black"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </>
    ) : (
      <>
    <path
      fill="#7fffd4"
      d="
        M50 10
        C27 10 15 30 18 52
        C21 75 38 90 50 90
        C62 90 79 75 82 52
        C85 30 73 10 50 10
        Z
      "
    />
    <ellipse cx="36" cy="48" rx="9" ry="15" fill="black" transform="rotate(-22 36 48)" />
    <ellipse cx="64" cy="48" rx="9" ry="15" fill="black" transform="rotate(22 64 48)" />
    <path
      d="M42 68 C47 72 53 72 58 68"
      fill="none"
      stroke="black"
      strokeWidth="3"
      strokeLinecap="round"
    />
      </>
    )}
  </svg>
))}

{flashbang && (
  <div
    key={flashbang.key}
    className={flashbang.type === "black" ? "flashbang-blackout" : "flashbang-whiteout"}
    aria-hidden="true"
  />
)}

{womboComboKey > 0 && (
  <div key={womboComboKey} className="wombo-combo-callout" aria-hidden="true">
    WOMBO<br />COMBO
  </div>
)}

{ufoSpiral && (
  <svg
    key={ufoSpiral.key}
    viewBox="0 0 120 80"
    className="ufo-heart-spiral flying-alien-head fixed pointer-events-none z-[10001] w-8 h-8"
    style={
      {
        left: `${ufoSpiral.x}px`,
        top: `${ufoSpiral.y}px`,
        "--spin": `${ufoSpiral.spin}`,
      } as React.CSSProperties
    }
    aria-hidden="true"
  >
    <ellipse cx="60" cy="42" rx="42" ry="12" fill="#ffffff" />
    <ellipse
      cx="60"
      cy="35"
      rx="22"
      ry="17"
      fill="none"
      stroke="#ffffff"
      strokeWidth="5"
    />
    <circle cx="38" cy="44" r="3" fill="black" />
    <circle cx="60" cy="46" r="3" fill="black" />
    <circle cx="82" cy="44" r="3" fill="black" />
  </svg>
)}

{heartPulse.key > 0 && (
  <div
    key={heartPulse.key}
    className="fixed inset-0 pointer-events-none z-[30]"
  >
    {[0, 1, 2, 3].map((i) => (
      <svg
        key={i}
        viewBox="0 0 100 100"
        className="clicked-heart-pulse absolute left-0 top-0 w-[60px] h-[60px]"
        style={{
          left: `${heartPulse.x}px`,
          top: `${heartPulse.y}px`,
          animationDelay: `${i * 120}ms`,
        }}
      >
        <path
          fill="none"
          stroke="#7fffd4"
          strokeWidth="1"
          d="
            M50 86
            C42 76 20 62 14 45
            C8 28 18 12 35 13
            C44 14 49 22 50 25
            C51 22 56 14 65 13
            C82 12 92 28 86 45
            C80 62 58 76 50 86
            Z
          "
        />
      </svg>
    ))}
  </div>
)}
      <div className="stars">
        <span className="star star-1"></span>
        <span className="star star-2"></span>
        <span className="star star-3"></span>
        <span className="star star-4"></span>
        <span className="star star-5"></span>
      </div>

{tvPos && (
  <aside
    ref={tvRef}
    className={`space-tv ${tvExpanded ? "space-tv-expanded" : ""}`}
    style={{
      left: tvExpanded ? "0px" : `${tvPos.x}px`,
      top: tvExpanded ? "0px" : `${tvPos.y}px`,
    }}
    onPointerDown={(e) => {
      if (tvExpanded) {
        if (e.target === e.currentTarget) {
          setTvExpanded(false);
        }

        return;
      }
    }}
    aria-label="Floating space TV"
  >
    <div className="space-tv-top">
      <div
        role="button"
        tabIndex={0}
        className="space-tv-handle"
        aria-label="Move TV"
        onPointerDown={dragTv}
      />
      <span
        ref={antennaRef}
        className="space-tv-antenna"
        role="button"
        tabIndex={0}
        aria-label="Spark TV antenna"
        onPointerDown={sparkTvAntenna}
      >
        {tvSpark && !flyingAliens.some((alien) => alien.stunnedUntil) && (
          <svg
            viewBox="0 0 100 46"
            className="space-tv-spark"
            aria-hidden="true"
          >
            <polyline
              points="8,24 28,10 42,30 58,12 72,32 92,18"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {tvSparkBurst > 0 && (
          <div key={tvSparkBurst} className="space-tv-spark-burst" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5].map((spark) => (
              <svg
                key={spark}
                viewBox="0 0 52 32"
                className={`space-tv-spark-bit space-tv-spark-bit-${spark}`}
              >
                <polyline
                  points="3,18 15,7 24,22 35,8 49,17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ))}
          </div>
        )}
      </span>
    </div>

    <div className="space-tv-body">
      <div
        className="space-tv-screen"
        onPointerDownCapture={() => {
          if (!tvExpanded) {
            setTvStarted(true);
            setTvExpanded(true);
          }
        }}
      >
        <iframe
          key={tvStarted ? "tv-started" : "tv-poster"}
          src={`https://www.tiktok.com/embed/v2/7623124860574731543?autoplay=1&muted=1&playsinline=1&start=${tvStarted ? "1" : "0"}`}
          title="SOUL music video"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="eager"
          className="space-tv-video"
        />
        {!tvStarted && <div className="space-tv-poster" aria-hidden="true" />}
        <div className="space-tv-scanlines" />
      </div>
    </div>
  </aside>
)}

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

      <main className="pink-text-glow min-h-screen text-white p-8 md:p-12 max-w-12xl mx-auto">
        <div className="flex flex-nowrap justify-center gap-10 sm:gap-10 mb-0 md:mb-4">
          <a
            href="https://open.spotify.com/artist/4aoqsXn1YULl9y1boDeTZA?si=mPVXh9BtR4KvRUSQoIyJYA"
            target="_blank"
            rel="noopener noreferrer"
            className="pink-icon-glow transition-all duration-200 hover:text-[#6ee7b7] active:text-[#6ee7b7]"
          >
            <FaSpotify size={48} />
          </a>

          <a
            href="https://www.instagram.com/everyonesanalien/"
            target="_blank"
            rel="noopener noreferrer"
            className="pink-icon-glow transition-all duration-200 hover:text-[#6ee7b7] active:text-[#6ee7b7]"
          >
            <FaInstagram size={48} />
          </a>

          <a
            href="https://www.tiktok.com/@everyonesanalien?lang=en-GB"
            target="_blank"
            rel="noopener noreferrer"
            className="pink-icon-glow transition-all duration-200 hover:text-[#6ee7b7] active:text-[#6ee7b7]"
          >
            <FaTiktok size={48} />
          </a>

          <a
            href="https://www.youtube.com/channel/UCTp_Wb8HBHWMQxXvNzxkksg"
            target="_blank"
            rel="noopener noreferrer"
            className="pink-icon-glow transition-all duration-200 hover:text-[#6ee7b7] active:text-[#6ee7b7]"
          >
            <FaYoutube size={48} />
          </a>

          <a
            href="mailto:soul.band.email@gmail.com"
            className="pink-icon-glow transition-all duration-200 hover:text-[#6ee7b7] active:text-[#6ee7b7]"
          >
            <FaEnvelope size={48} />
          </a>
        </div>

        <div className="relative mt-8 mb-0 -mx-8 md:-mx-12 overflow-hidden">
          <p className="text-center text-white text-sm md:text-sm tracking-[0.2em] uppercase mb-[-0.7rem]">
            a band called...
          </p>
          

          <div className="flex items-center justify-center w-full mt-0">
            <div className="pink-line-glow h-[4px] bg-white flex-1 mr-2" />

            <h1 className="relative z-10 text-6xl font-bold text-center flex justify-center items-center text-white shrink-0">
              <span className="-mr-4">S</span>

              <span 
              ref={orbitRef}
              className="group relative inline-flex items-center justify-center w-28 h-24 mx-0 overflow-hidden">
                <svg
  viewBox="0 0 100 100"
  className="absolute -translate-y-0.5 w-8 h-8 z-30 cursor-pointer"
  onClick={toggleUfoOrbit}
>
                  <defs>
                    <filter id="heartGlow" x="-80%" y="-80%" width="260%" height="260%">
                      <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#7fffd4" floodOpacity="0.9" />
                      <feDropShadow dx="0" dy="0" stdDeviation="11" floodColor="#7fffd4" floodOpacity="0.35" />
                    </filter>
                  </defs>
                  <path
                    filter="url(#heartGlow)"
                    className="fill-[#7fffd4] transition-colors duration-200 group-hover:fill-white group-active:fill-white"
                    d="
                      M50 86
                      C42 76 20 62 14 45
                      C8 28 18 12 35 13
                      C44 14 49 22 50 25
                      C51 22 56 14 65 13
                      C82 12 92 28 86 45
                      C80 62 58 76 50 86
                      Z
                    "
                  />
                </svg>

                <svg
  className={`orbital-ring absolute inset-0 w-full h-full z-20 cursor-pointer ${
  ringBlinking ? "orbital-ring-blink-now" : ""
}`}
  viewBox="0 0 120 80"
  onClick={toggleUfoOrbit}
>
  <defs>
    <filter id="orbitGlow" x="-50%" y="-80%" width="200%" height="260%">
      <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#7fffd4" floodOpacity="0.85" />
      <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#7fffd4" floodOpacity="0.32" />
    </filter>
  </defs>
  <ellipse
    cx="60"
    cy="39"
    rx="40"
    ry="21"
    filter="url(#orbitGlow)"
    className="fill-transparent stroke-[#7fffd4] transition-colors duration-200 group-hover:fill-[#7fffd4] group-active:fill-[#7fffd4]"
    strokeWidth="5"
  />
</svg>
{ufoOrbiting && (
  <div className="absolute inset-0 z-40 pointer-events-none">
    <svg
      viewBox="0 0 120 80"
      className="pink-svg-glow ufo-on-orbit absolute left-0 top-0 w-8 h-8 opacity-95"
    >
      <ellipse cx="60" cy="42" rx="42" ry="12" fill="#ffffff" />
      <ellipse
        cx="60"
        cy="35"
        rx="22"
        ry="17"
        fill="none"
        stroke="#ffffff"
        strokeWidth="5"
      />
      <circle cx="38" cy="44" r="3" fill="black" />
      <circle cx="60" cy="46" r="3" fill="black" />
      <circle cx="82" cy="44" r="3" fill="black" />
    </svg>
  </div>
  
)}


              </span>

              <span className="-ml-3">UL</span>
            </h1>

            <div className="pink-line-glow h-[4px] bg-white flex-1 ml-2" />
          </div>
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

    {wishRulesKey > 0 && (
      <div key={wishRulesKey} className="wish-rules-box">
        <p>Rule 1: Can&apos;t kill anybody.</p>
        <p>Rule 2: Can&apos;t make anyone fall in love.</p>
        <p>Rule 3: Can&apos;t bring people back from the dead.</p>
        <p>And no wishing for more wishes!</p>
      </div>
    )}

    {wishPoof > 0 && (
      <div
        key={wishPoof}
        className={`wish-burst-layer ${pongWish ? "wish-pong-layer" : ""} ${
          hideWishLayerForFlash ? "wish-flash-hidden" : ""
        } ${
          slowWishLayerReturn ? "wish-flash-blackout-return" : ""
        }`}
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

        <div className="grid gap-8 md:gap-16 md:grid-cols-3 mt-2 mb-4 md:mb-16">
          <section className="md:max-w-sm md:mx-auto">
            <h2 className="text-2xl mb-4">GET YOUR HYPER-FIX</h2>
            <p className="mb-4">
              Sign up to SOUL&apos;s mailing list for discounts on merch and tickets to headline shows!
            </p>

            <form
              className="flex flex-col gap-3 max-w-md md:mx-auto"
              onSubmit={async (e) => {
                e.preventDefault();
                setStatus("loading");

                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);

                const email = formData.get("email");

                const res = await fetch("/api/subscribe", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ email }),
                });

                if (res.ok) {
                  const data = await res.json();
                  form.reset();

                  if (data.alreadySubscribed) {
                    setStatus("already");
                  } else {
                    setStatus("success");
                  }
                } else {
                  setStatus("error");
                }
              }}
            >
              <input
                name="email"
                type="email"
                placeholder="EMAIL"
                className="pink-border-glow border border-white bg-[#00082d] p-2"
                required
              />

              <button
                className="pink-border-glow pink-text-glow border border-white p-2 hover:bg-[#6ee7b7] hover:border-[#6ee7b7] hover:text-[#00082d] active:bg-[#6ee7b7] active:border-[#6ee7b7] active:text-[#00082d] transition-all duration-200 disabled:opacity-50"
                disabled={status === "loading"}
              >
                {status === "loading" ? "MATING..." : "BECOME A MATE"}
              </button>
            </form>

            {status === "success" && (
              <div className="pink-border-glow mt-4 border border-white p-3">
                WELCOME ABOARD.
                <br />
                You are now a Mate of the Band!
              </div>
            )}

            {status === "error" && (
              <div className="mt-4 border border-red-500 p-3 text-red-400">
                Mating failed, please try again.
              </div>
            )}

            {status === "already" && (
              <div className="pink-border-glow mt-4 border border-white p-3">
                You&apos;re already a Mate, mate.
              </div>
            )}
          </section>

          <section className="mt-4 md:mt-0 md:max-w-sm md:mx-auto">
            <h2 className="text-2xl mb-4">UPCOMING SHOWS</h2>

            <ul className="space-y-2">
              <li>
                <a
                  href="https://link.dice.fm/Md31a985f532?dice_id=Md31a985f532"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pink-border-glow inline-block border border-white px-3 py-2 hover:bg-[#6ee7b7] hover:border-[#6ee7b7] hover:text-[#00082d] active:bg-[#6ee7b7] active:border-[#6ee7b7] active:text-[#00082d] transition-all duration-200"
                >
                  LONDON 25th June
                </a>
              </li>
            </ul>
          </section>

          <section className="md:max-w-sm md:mx-auto">
            <h2 className="text-2xl mb-4">MERCH</h2>

            <p>
              Coming soon
              <span className="animate-pulse">_</span>
            </p>
          </section>
        </div>






               <div ref={footerRef} className="pink-line-glow fixed bottom-0 inset-x-0 z-40 overflow-hidden border-t border-white bg-[#00082d]/80 py-2">
  <div className="alien-footer-marquee flex w-max items-center">
    {[0, 1].map((track) => (
      <div key={track} className="flex items-center gap-8 px-4 shrink-0">
        {[...Array(18)].map((_, i) => (
          <svg
            key={`${track}-${i}`}
            viewBox="0 0 100 100"
            onPointerDown={launchAlien}
            className="footer-alien-head w-8 h-8 shrink-0 opacity-90 pointer-events-auto cursor-pointer"
          >
            <path
              className="footer-alien-head-fill"
              d="
                M50 10
                C27 10 15 30 18 52
                C21 75 38 90 50 90
                C62 90 79 75 82 52
                C85 30 73 10 50 10
                Z
              "
            />
            <ellipse cx="36" cy="48" rx="9" ry="15" fill="black" transform="rotate(-22 36 48)" />
            <ellipse cx="64" cy="48" rx="9" ry="15" fill="black" transform="rotate(22 64 48)" />
            <path
              d="M42 68 C47 72 53 72 58 68"
              fill="none"
              stroke="black"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        ))}

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="shrink-0 mx-2 px-4 py-1 border border-[#6ee7b7] text-[#6ee7b7] text-sm md:text-base font-bold tracking-[0.25em] pointer-events-auto transition-all duration-200 hover:bg-[#6ee7b7] hover:text-[#00082d] active:bg-white active:border-white active:text-[#00082d]"
        >
          everyonesanalien.com
        </button>

        {[...Array(18)].map((_, i) => (
          <svg
            key={`${track}-b-${i}`}
            viewBox="0 0 100 100"
            onPointerDown={launchAlien}
            className="footer-alien-head w-8 h-8 shrink-0 opacity-90 pointer-events-auto cursor-pointer"
          >
            <path
              className="footer-alien-head-fill"
              d="
                M50 10
                C27 10 15 30 18 52
                C21 75 38 90 50 90
                C62 90 79 75 82 52
                C85 30 73 10 50 10
                Z
              "
            />
            <ellipse cx="36" cy="48" rx="9" ry="15" fill="black" transform="rotate(-22 36 48)" />
            <ellipse cx="64" cy="48" rx="9" ry="15" fill="black" transform="rotate(22 64 48)" />
            <path
              d="M42 68 C47 72 53 72 58 68"
              fill="none"
              stroke="black"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        ))}
      </div>
    ))}
  </div>
</div>
      </main>
    </>
  );
}
