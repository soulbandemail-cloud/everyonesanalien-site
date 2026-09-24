import { useId } from 'react';
import { PLANET_INK, REAL_HEART_PATH } from '@/lib/ship/wordmarkGeometry';

/** The existing exterior planet, now the single O in the live projected wordmark. */
export default function RealPlanetHeart() {
 const id=useId();
 const ringGlowId=`${id}-ring-glow`;
 return <span className="soul-planet" data-world-object="planet-heart" aria-hidden="true">
  <svg className="real-planet-heart" viewBox={`${PLANET_INK.left} ${PLANET_INK.top} ${PLANET_INK.right-PLANET_INK.left} ${PLANET_INK.bottom-PLANET_INK.top}`}>
   <defs><radialGradient id={id} cx="32%" cy="25%" r="85%"><stop stopColor="#b5ffe0"/><stop offset=".65" stopColor="#42cfa0"/><stop offset="1" stopColor="#126b60"/></radialGradient>
    {/* Explicit user-space bounds cover both ring halves and their widest halo. */}
    <filter id={ringGlowId} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x="-200" y="-150" width="400" height="300" colorInterpolationFilters="sRGB">
     <feGaussianBlur in="SourceAlpha" stdDeviation="8" result="near-blur" />
     <feFlood floodColor="rgb(255,176,255)" floodOpacity=".140" result="near-pink" />
     <feComposite in="near-pink" in2="near-blur" operator="in" result="near-halo" />
     <feGaussianBlur in="SourceAlpha" stdDeviation="18" result="middle-blur" />
     <feFlood floodColor="rgb(255,176,255)" floodOpacity=".100" result="middle-pink" />
     <feComposite in="middle-pink" in2="middle-blur" operator="in" result="middle-halo" />
     <feGaussianBlur in="SourceAlpha" stdDeviation="36" result="outer-blur" />
     <feFlood floodColor="rgb(255,176,255)" floodOpacity=".50" result="outer-pink" />
     <feComposite in="outer-pink" in2="outer-blur" operator="in" result="outer-halo" />
     <feMerge>
      <feMergeNode in="outer-halo" /><feMergeNode in="middle-halo" /><feMergeNode in="near-halo" />
      <feMergeNode in="SourceGraphic" />
     </feMerge>
    </filter>
   </defs>
   <g transform="rotate(-18)">
    <path data-ring="rear" d="M-88 0 A88 25 0 0 1 88 0" fill="none" stroke="white" className="planet-letter-ring" filter={`url(#${ringGlowId})`} strokeWidth="9" />
   </g>
   <path d={REAL_HEART_PATH} fill={`url(#${id})`} stroke="#369f83" strokeWidth=".6"/>
   <g transform="rotate(-18)"><path data-ring="front" d="M88 0 A88 25 0 0 1 -88 0" fill="none" stroke="white" className="planet-letter-ring" filter={`url(#${ringGlowId})`} strokeWidth="9" /></g>
  </svg>
 </span>;
}
