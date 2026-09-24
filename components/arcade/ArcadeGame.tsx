"use client";
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { arcadePoint, arcadeRect, arcadeSize } from './presentation';
import PlanetHeart from '../home/PlanetHeart';
import { useOrbitDischarge } from './useOrbitDischarge';
import { hitBolt } from './discharge';
import { useScopedLifecycle } from '../home/useScopedLifecycle';
import './arcade.css';

const ZAP_STUN_DURATION = 1000;
const ZAP_RECATCH_COOLDOWN = 700;
const FOOTER_BOUNCE_COOLDOWN = 140;

type TractorCollectionType = "alien" | "whiteSkull" | "blackSkull";

const TRACTOR_COLLECTION_TYPES: TractorCollectionType[] = [
  "alien",
  "whiteSkull",
  "blackSkull",
];

const TRACTOR_COLLECTION_LABELS: Record<TractorCollectionType, string> = {
  alien: "Alien heads",
  whiteSkull: "White skulls",
  blackSkull: "Black skulls",
};

const TractorCounterIcon = ({ type }: { type: TractorCollectionType }) => {
  if (type === "alien") {
    return (
      <svg viewBox="0 0 100 100" className="tractor-counter-icon" aria-hidden="true">
        <path
          fill="#7fffd4"
          d="M50 10 C27 10 15 30 18 52 C21 75 38 90 50 90 C62 90 79 75 82 52 C85 30 73 10 50 10 Z"
        />
        <ellipse cx="36" cy="48" rx="9" ry="15" fill="black" transform="rotate(-22 36 48)" />
        <ellipse cx="64" cy="48" rx="9" ry="15" fill="black" transform="rotate(22 64 48)" />
      </svg>
    );
  }

  const isBlack = type === "blackSkull";
  const skullColor = isBlack ? "#050505" : "#ffffff";
  const faceColor = isBlack ? "#ffffff" : "#050505";

  return (
    <svg viewBox="0 0 100 100" className="tractor-counter-icon" aria-hidden="true">
      <path
        fill={skullColor}
        stroke={isBlack ? "#ffffff" : "none"}
        strokeWidth={isBlack ? 3 : 0}
        d="M50 10 C27 10 15 30 18 52 C21 75 38 90 50 90 C62 90 79 75 82 52 C85 30 73 10 50 10 Z"
      />
      <ellipse cx="36" cy="45" rx="9" ry="13" fill={faceColor} transform="rotate(-14 36 45)" />
      <ellipse cx="64" cy="45" rx="9" ry="13" fill={faceColor} transform="rotate(14 64 45)" />
      <path d="M41 68 H59" stroke={faceColor} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
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
  lastZapCatch?: number;
  needsZapExit?: boolean;
  tractorCaptured?: boolean;
  tractorCapturedAt?: number;
  tractorScale?: number;
  lastFooterBounce?: number;
};

export default function ArcadeGame({ onRestart }: { onRestart: () => void }) {
  const minigameEnabled = true;
  const gameRoot = useRef<HTMLDivElement | null>(null);
  const lifecycle = useScopedLifecycle();
  const footerRef = useRef<HTMLDivElement | null>(null);
  const womboComboTimeoutRef = useRef<number | null>(null);
  const heartPulseTimeoutRef = useRef<number | null>(null);
  const ufoPosRef = useRef({ x: -100, y: -100 });
  const tractorBeamActiveRef = useRef(false);
  const collectedTractorIdsRef = useRef(new Set<number>());
  
  const [flashbang, setFlashbang] = useState<{
    key: number;
    type: "white" | "black";
  } | null>(null);
  const [womboComboKey, setWomboComboKey] = useState(0);
  
  const [ufoPos, setUfoPos] = useState({ x: -100, y: -100 });
  const [hideCursorUfo, setHideCursorUfo] = useState(false);
  const [tractorBeamActive, setTractorBeamActive] = useState(false);
  const [tractorCounts, setTractorCounts] = useState<Record<TractorCollectionType, number>>({
    alien: 0,
    whiteSkull: 0,
    blackSkull: 0,
  });
  const [ringBlinking, setRingBlinking] = useState(false);

  const [flyingAliens, setFlyingAliens] = useState<FlyingAlien[]>([]);

const orbitRef = useRef<HTMLSpanElement | null>(null);
  const ufoOrbitingRef = useRef(false);
  const [ufoOrbiting, setUfoOrbiting] = useState(false);
  
  const [heartPulse, setHeartPulse] = useState({
  x: -100,
  y: -100,
  key: 0,
});
const toggleUfoOrbit = () => {
  setUfoOrbiting((orbiting) => {
    const nextOrbiting = !orbiting;

    ufoOrbitingRef.current = nextOrbiting;

    if (nextOrbiting) {
      tractorBeamActiveRef.current = false;
      setTractorBeamActive(false);
    }

    return nextOrbiting;
  });
};

const triggerWomboCombo = (key: number) => {
  setWomboComboKey(key);

  if (womboComboTimeoutRef.current) {
    window.clearTimeout(womboComboTimeoutRef.current);
  }

  womboComboTimeoutRef.current = lifecycle.timeout(() => {
    setWomboComboKey((current) => (current === key ? 0 : current));
    womboComboTimeoutRef.current = null;
  }, 1700);
};

const triggerHeartPulse = (x: number, y: number, key: number) => {
  setHeartPulse({ x, y, key });

  if (heartPulseTimeoutRef.current) {
    window.clearTimeout(heartPulseTimeoutRef.current);
  }

  heartPulseTimeoutRef.current = lifecycle.timeout(() => {
    setHeartPulse((current) =>
      current.key === key ? { x: -100, y: -100, key: 0 } : current
    );
    heartPulseTimeoutRef.current = null;
  }, 3000);
};

const triggerFlashbang = (key: number, type: "white" | "black") => {
  setFlashbang({ key, type });
};

const electricity = useOrbitDischarge(gameRoot, orbitRef, ufoOrbitingRef, () => {
  // Same effect as black-skull/heart impact; overload does not award Wombo.
  triggerFlashbang(Date.now(), "black");
  ufoOrbitingRef.current = false;
  setUfoOrbiting(false);
});

const launchAlien = (e: React.PointerEvent<SVGSVGElement>) => {
  e.preventDefault();
  e.stopPropagation();

  const rect = arcadeRect(gameRoot.current,e.currentTarget);
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

const reflectAlienOffFooterLine = (
  alien: FlyingAlien,
  next: FlyingAlien,
  now: number
) => {
  const footerTop = footerRef.current ? arcadeRect(gameRoot.current,footerRef.current).top : undefined;

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

  useEffect(() => {
  if (!minigameEnabled) return;
  const moveUfo = (e: PointerEvent) => {
    if ((e.target as Element)?.closest?.("[data-arcade-controls]")) return;
    const nextPosition = arcadePoint(gameRoot.current,{x:e.clientX,y:e.clientY});

    ufoPosRef.current = nextPosition;
    setUfoPos(nextPosition);
  };

  window.addEventListener("pointermove", moveUfo);
  window.addEventListener("pointerdown", moveUfo);

  return () => {
    window.removeEventListener("pointermove", moveUfo);
    window.removeEventListener("pointerdown", moveUfo);
  };
}, [minigameEnabled]);

useEffect(() => {
  if (!minigameEnabled) return;
  const respawnUfo = (e: PointerEvent) => {
    if (!hideCursorUfo) return;

    const nextPosition = arcadePoint(gameRoot.current,{x:e.clientX,y:e.clientY});

    ufoPosRef.current = nextPosition;
    setUfoPos(nextPosition);

    setHideCursorUfo(false);
  };

  window.addEventListener("pointerdown", respawnUfo);

  return () => {
    window.removeEventListener("pointerdown", respawnUfo);
  };
}, [hideCursorUfo, minigameEnabled]);

useEffect(() => {
  if (!minigameEnabled) return;
  const startTractorBeam = (e: PointerEvent) => {
    const supportsDesktopPointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;
    const supportsTouchPointer = window.matchMedia("(pointer: coarse)").matches;
    const isDesktopActivation =
      e.pointerType === "mouse" && e.button === 0 && supportsDesktopPointer;
    const isTouchActivation =
      e.pointerType === "touch" && supportsTouchPointer;

    if (
      (!isDesktopActivation && !isTouchActivation) ||
      ufoOrbitingRef.current ||
      hideCursorUfo
    ) {
      return;
    }

    tractorBeamActiveRef.current = true;
    setTractorBeamActive(true);
  };

  const stopTractorBeam = () => {
    tractorBeamActiveRef.current = false;
    setTractorBeamActive(false);
  };

  window.addEventListener("pointerdown", startTractorBeam);
  window.addEventListener("pointerup", stopTractorBeam);
  window.addEventListener("pointercancel", stopTractorBeam);
  window.addEventListener("blur", stopTractorBeam);

  return () => {
    window.removeEventListener("pointerdown", startTractorBeam);
    window.removeEventListener("pointerup", stopTractorBeam);
    window.removeEventListener("pointercancel", stopTractorBeam);
    window.removeEventListener("blur", stopTractorBeam);
  };
}, [hideCursorUfo, minigameEnabled]);

const touchesTractorBeam = (alien: FlyingAlien) => {
  if (!tractorBeamActiveRef.current || ufoOrbitingRef.current) return false;

  const beamWidth = Math.min(47.5, Math.max(30, arcadeSize(gameRoot.current).width * 0.0375));
  const beamHeight = Math.min(85, arcadeSize(gameRoot.current).height * 0.105);
  const beamTop = ufoPosRef.current.y + 8;
  const beamBottom = beamTop + beamHeight;
  const headRadius = 12;

  if (alien.y + headRadius < beamTop || alien.y - headRadius > beamBottom) {
    return false;
  }

  const contactY = Math.min(beamBottom, Math.max(beamTop, alien.y));
  const contactProgress = (contactY - beamTop) / beamHeight;
  const halfWidthAtContact = beamWidth * (0.06 + 0.44 * contactProgress);

  return (
    Math.abs(alien.x - ufoPosRef.current.x) <=
    halfWidthAtContact + headRadius
  );
};

const recordTractorCapture = (alien: FlyingAlien) => {
  if (collectedTractorIdsRef.current.has(alien.id)) return;

  collectedTractorIdsRef.current.add(alien.id);

  const type: TractorCollectionType = alien.isBlackSkull
    ? "blackSkull"
    : alien.isSkull
      ? "whiteSkull"
      : "alien";

  setTractorCounts((current) => ({
    ...current,
    [type]: current[type] + 1,
  }));
};

useEffect(() => {
  if (!minigameEnabled) return;
  if (!flashbang) return;

  const clearFlashTimeout = lifecycle.timeout(() => {
    setFlashbang(null);
  }, 2800);

  return () => {
    window.clearTimeout(clearFlashTimeout);
  };
}, [flashbang, minigameEnabled, lifecycle]);

const tickPhysics = useEffectEvent(() => {
    
    setFlyingAliens((aliens) => {
      if (!orbitRef.current) return aliens;

      const rect = arcadeRect(gameRoot.current,orbitRef.current);
      const heartX = rect.left + rect.width / 2;
      const heartY = rect.top + rect.height / 2;
      const zapPath = electricity.engine.drawing?.points ?? [];
      const zapRadius = electricity.headWidth.current / 2 + 2;
      const now = Date.now();

      return aliens
        .map((alien) => {
          if (alien.tractorCaptured) {
            const targetX = ufoPosRef.current.x;
            const targetY = ufoPosRef.current.y;
            const dx = targetX - alien.x;
            const dy = targetY - alien.y;
            const elapsed = now - (alien.tractorCapturedAt ?? now);
            const shrinkDuration = 360;

            if (elapsed >= shrinkDuration) return null;

            const nextX = alien.x + dx * 0.3;
            const nextY = alien.y + dy * 0.3;

            return {
              ...alien,
              x: nextX,
              y: nextY,
              vx: 0,
              vy: 0,
              tractorScale: Math.max(0, 1 - elapsed / shrinkDuration),
            };
          }

          if (alien.stunnedUntil && now < alien.stunnedUntil) {
            return alien;
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

          next = reflectAlienOffFooterLine(activeAlien, next, now);

          if (touchesTractorBeam(next)) {
            recordTractorCapture(next);

            return {
              ...next,
              tractorCaptured: true,
              tractorCapturedAt: now,
              tractorScale: 1,
              vx: 0,
              vy: 0,
            };
          }

          const contact = hitBolt(activeAlien, next, zapPath, zapRadius);
          const nearZap = Boolean(hitBolt(next, next, zapPath, zapRadius));
          const needsZapExit = Boolean(activeAlien.needsZapExit && nearZap);
          if (activeAlien.needsZapExit !== needsZapExit) next = { ...next, needsZapExit };
          const hitZap = contact && !activeAlien.stunnedUntil && !needsZapExit &&
            now - (activeAlien.lastZapCatch ?? 0) > ZAP_RECATCH_COOLDOWN;
          if (hitZap) {
            return {
              ...next,
              x: contact.x,
              y: contact.y,
              isSkull: true,
              isBlackSkull: next.isSkull ? false : next.isBlackSkull,
              turningBlack: next.isSkull || next.isBlackSkull,
              stunnedUntil: now + ZAP_STUN_DURATION,
              lastZapCatch: now,
              needsZapExit: true,
            };
          }

          const hitHeart = Math.hypot(next.x - heartX, next.y - heartY) < 42;

          if (hitHeart) {
            if (next.isBlackSkull) {
              const key = Date.now();
              

              setRingBlinking(true);
              
              triggerFlashbang(key, "black");
              triggerWomboCombo(key);
              

              lifecycle.timeout(() => {
                setRingBlinking(false);
              }, 420);

              return null;
            }

            if (next.isSkull) {
              const key = Date.now();

              setRingBlinking(true);
              ufoOrbitingRef.current = false;
              setUfoOrbiting(false);
              tractorBeamActiveRef.current = false;
              setTractorBeamActive(false);
              setHideCursorUfo(true);
              triggerFlashbang(key, "white");
              

              lifecycle.timeout(() => {
                setRingBlinking(false);
              }, 420);

              return null;
            }

            const key = Date.now();
            

            setRingBlinking(true);
            ufoOrbitingRef.current = false;
            setUfoOrbiting(false);
            tractorBeamActiveRef.current = false;
            setTractorBeamActive(false);
            setHideCursorUfo(true);
            triggerHeartPulse(heartX, heartY, key);

            lifecycle.timeout(() => {
              setRingBlinking(false);
            }, 420);

            return null;
          }

          const offscreen =
            next.x < -80 ||
            next.x > arcadeSize(gameRoot.current).width + 80 ||
            next.y < -80 ||
            next.y > arcadeSize(gameRoot.current).height + 80;

          return offscreen ? null : next;
        })
        .filter((alien): alien is FlyingAlien => alien !== null);
    });
});
useEffect(() => {
  const interval = window.setInterval(tickPhysics, 16);
  return () => window.clearInterval(interval);
}, []);

return (
  <div ref={gameRoot} className="arcade-game" aria-label="SOUL arcade playfield">
    <div className="arcade-charge" data-arcade-controls>
      <div className="arcade-charge-meter" role="progressbar" aria-label="Charge" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(electricity.display.charge * 100)}>
        <div style={{transform:`scaleX(${electricity.display.charge})`}} />
      </div>
      <span>CHARGE</span>
    </div>
    {electricity.display.points.length > 1 && <svg className="arcade-discharge" aria-hidden="true">
      <polyline points={electricity.display.points.map(p=>`${p.x},${p.y}`).join(' ')} />
    </svg>}
    {minigameEnabled && <>
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
      {tractorBeamActive && !ufoOrbiting && !hideCursorUfo && (
        <div className="ufo-tractor-beam" aria-hidden="true" />
      )}
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
        "--tractor-scale": `${alien.tractorScale ?? 1}`,
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

    </>}
      <main className="pink-text-glow min-h-screen text-white p-8 md:p-12 max-w-12xl mx-auto">
        <div className="h-12 mb-0 md:mb-4" aria-hidden="true" />
        <div  className="relative mt-8 mb-0 -mx-8 md:-mx-12 overflow-hidden">
          <p className="text-center text-white text-sm md:text-sm tracking-[0.2em] uppercase mb-[-0.7rem]">
            a band called...
          </p>
          

          <div className="flex items-center justify-center w-full mt-0">
            <div className="pink-line-glow h-[4px] bg-white flex-1 mr-2" />

            <h1 className="relative z-10 text-6xl font-bold text-center flex justify-center items-center text-white shrink-0">
              <span className="-mr-4">S</span>

              <PlanetHeart anchorRef={orbitRef} onToggle={toggleUfoOrbit} ringBlinking={ringBlinking} ufoOrbiting={ufoOrbiting} />
              <span className="-ml-3">UL</span>
            </h1>

            <div className="pink-line-glow h-[4px] bg-white flex-1 ml-2" />
          </div>
        </div>

        {minigameEnabled && TRACTOR_COLLECTION_TYPES.some((type) => tractorCounts[type] > 0) && (
          <div className="tractor-counter-stack" aria-live="polite">
            {TRACTOR_COLLECTION_TYPES.map((type) =>
              tractorCounts[type] > 0 ? (
                <div
                  key={type}
                  className="tractor-counter"
                  aria-label={`${TRACTOR_COLLECTION_LABELS[type]}: ${tractorCounts[type]}`}
                >
                  <TractorCounterIcon type={type} />
                  <span className="tractor-counter-x" aria-hidden="true">X</span>
                  <span>{tractorCounts[type]}</span>
                </div>
              ) : null
            )}
          </div>
        )}


               {minigameEnabled && <div ref={footerRef} data-no-zap className="saucer-hull-strip fixed bottom-0 inset-x-0 z-40 overflow-hidden py-2">
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
          onClick={onRestart}
          aria-label="Restart arcade"
          className="saucer-name-plate shrink-0 mx-2 px-4 py-1 border border-[#6ee7b7] text-[#6ee7b7] text-sm md:text-base font-bold tracking-[0.25em] pointer-events-auto transition-all duration-200 hover:bg-[#6ee7b7] hover:text-[#00082d] active:bg-white active:border-white active:text-[#00082d]"
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
</div>}
      </main>
    </div>
  );
}
