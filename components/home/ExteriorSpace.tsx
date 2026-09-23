import './exterior.css';
import { useId } from 'react';
import { project, type DomeConfig, type Viewport } from '@/lib/ship/domeGeometry';
import { exteriorPlane, PLANET_HEART, planetScreenY, firstPersonPlanetY } from '@/lib/ship/exteriorSpace';

/** One persistent exterior, behind the live domepage and opaque ship structure. */
export default function ExteriorSpace({config,camera,view,progress=1}:{config:DomeConfig;camera:DomeConfig;view:Viewport;progress?:number}) {
 const id=useId();
 const planet=project(PLANET_HEART.position,camera,view);
 const size=planet.scale*PLANET_HEART.radius;
 // User-directed first-person composition offset, eased out by the existing camera progress.
 const y=planetScreenY(planet.y,firstPersonPlanetY(view.height),progress);
 return <div className="exterior-space" aria-hidden="true">
  <div className="exterior-star-plane" style={{transform:exteriorPlane(config,camera,view)}}>
   <div className="stars">{[1,2,3,4,5].map(i=><span key={i} className={`star star-${i}`} />)}</div>
  </div>
  {planet.visible && <svg data-world-object="planet-heart" className="real-planet-heart" viewBox="-100 -75 200 150" style={{left:planet.x-size,top:y-size*.75,width:size*2,height:size*1.5}}>
   <defs><radialGradient id={id} cx="32%" cy="25%" r="85%"><stop stopColor="#9eccc4"/><stop offset=".65" stopColor="#41646f"/><stop offset="1" stopColor="#101e36"/></radialGradient></defs>
   <g transform="rotate(-18)">
    <path data-ring="rear" d="M-88 0 A88 25 0 0 1 88 0" fill="none" stroke="#829b9f" strokeWidth="9" />
   </g>
   <path d="M0 52 C-13 34 -49 12 -49 -15 C-49 -48 -12 -53 0 -28 C12 -53 49 -48 49 -15 C49 12 13 34 0 52Z" fill={`url(#${id})`} stroke="#73928f" strokeWidth=".6"/>
   <g transform="rotate(-18)"><path data-ring="front" d="M88 0 A88 25 0 0 1 -88 0" fill="none" stroke="#b4c7c4" strokeWidth="9" /></g>
  </svg>}
 </div>;
}
