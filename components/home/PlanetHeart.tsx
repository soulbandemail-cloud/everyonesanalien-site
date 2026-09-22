import { useId, type Ref } from 'react';

/** Shared visual asset; only the arcade supplies game state and handlers. */
export default function PlanetHeart({ anchorRef, onToggle, ringBlinking = false, ufoOrbiting = false }: {
 anchorRef?: Ref<HTMLSpanElement>; onToggle?: () => void; ringBlinking?: boolean; ufoOrbiting?: boolean;
}) {
 const id = useId();
 const heartId = `${id}-heart`, orbitId = `${id}-orbit`;
 return (<span 
              ref={anchorRef}
              className="group relative inline-flex items-center justify-center w-28 h-24 mx-0 overflow-hidden">
                <svg
  viewBox="0 0 100 100"
  className="absolute -translate-y-0.5 w-8 h-8 z-30 cursor-pointer"
  onClick={onToggle}
>
                  <defs>
                    <filter id={heartId} x="-80%" y="-80%" width="260%" height="260%">
                      <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#7fffd4" floodOpacity="0.9" />
                      <feDropShadow dx="0" dy="0" stdDeviation="11" floodColor="#7fffd4" floodOpacity="0.35" />
                    </filter>
                  </defs>
                  <path
                    filter={`url(#${heartId})`}
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
  onClick={onToggle}
>
  <defs>
    <filter id={orbitId} x="-50%" y="-80%" width="200%" height="260%">
      <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#7fffd4" floodOpacity="0.85" />
      <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#7fffd4" floodOpacity="0.32" />
    </filter>
  </defs>
  <ellipse
    cx="60"
    cy="39"
    rx="40"
    ry="21"
    filter={`url(#${orbitId})`}
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


              </span>);
}
