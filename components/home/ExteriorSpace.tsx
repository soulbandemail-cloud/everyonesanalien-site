import './exterior.css';
import { type DomeConfig, type Viewport } from '@/lib/ship/domeGeometry';
import { exteriorPlane } from '@/lib/ship/exteriorSpace';

/** Persistent exterior stars; the one planet is anchored in the live SOUL wordmark. */
export default function ExteriorSpace({config,camera,view}:{config:DomeConfig;camera:DomeConfig;view:Viewport}) {
 return <div className="exterior-space" aria-hidden="true">
  <div className="exterior-star-plane" style={{transform:exteriorPlane(config,camera,view)}}>
   <div className="stars">{[1,2,3,4,5].map(i=><span key={i} className={`star star-${i}`} />)}</div>
  </div>
 </div>;
}
