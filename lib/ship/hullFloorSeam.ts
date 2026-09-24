import type { DomeConfig } from './domeGeometry';
import { ROOM } from './roomGeometry';

export const SEAM_SECTORS=128;
/** Authoritative interior-facing hull edge: the exact circular floor perimeter. */
export function hullFloorSeamPoint(theta: number, dome: DomeConfig) {
 return {x:dome.centre.x+dome.radius*Math.sin(theta),y:ROOM.floorY,z:dome.centre.z+dome.radius*Math.cos(theta)};
}
export function hullFloorBoundary(dome: DomeConfig) {
 return Array.from({length:SEAM_SECTORS},(_,i)=>hullFloorSeamPoint(i/SEAM_SECTORS*Math.PI*2,dome));
}
