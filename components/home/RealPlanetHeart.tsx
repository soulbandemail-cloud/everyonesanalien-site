import { useId } from 'react';
import { PLANET_INK, REAL_HEART_PATH } from '@/lib/ship/wordmarkGeometry';

/** The existing exterior planet, now the single O in the live projected wordmark. */
export default function RealPlanetHeart() {
 const id=useId();
 return <span className="soul-planet" data-world-object="planet-heart" aria-hidden="true">
  <svg className="real-planet-heart" viewBox={`${PLANET_INK.left} ${PLANET_INK.top} ${PLANET_INK.right-PLANET_INK.left} ${PLANET_INK.bottom-PLANET_INK.top}`}>
   <defs><radialGradient id={id} cx="32%" cy="25%" r="85%"><stop stopColor="#b5ffe0"/><stop offset=".65" stopColor="#42cfa0"/><stop offset="1" stopColor="#126b60"/></radialGradient></defs>
   <g transform="rotate(-18)">
    <path data-ring="rear" d="M-88 0 A88 25 0 0 1 88 0" fill="none" stroke="white" className="planet-letter-ring" strokeWidth="9" />
   </g>
   <path d={REAL_HEART_PATH} fill={`url(#${id})`} stroke="#369f83" strokeWidth=".6"/>
   <g transform="rotate(-18)"><path data-ring="front" d="M88 0 A88 25 0 0 1 -88 0" fill="none" stroke="white" className="planet-letter-ring" strokeWidth="9" /></g>
  </svg>
 </span>;
}
