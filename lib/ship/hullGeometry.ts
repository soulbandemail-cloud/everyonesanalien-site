import type { DomeConfig, Vec3 } from './domeGeometry';

export type HullConfig = { outerRadius: number; drop: number; profile: number };
export const DEFAULT_HULL: HullConfig = { outerRadius: 14.5, drop: 1.8, profile: 2 };
/** Shallow convex upper surface, tangent to the base at t=0, descending to the rim.
 * The base radius is the glass sphere's radius: independent values would detach them.
 */
export function hullHeight(radius: number, dome: DomeConfig, hull: HullConfig) {
  const t = Math.max(0,Math.min(1,(radius-dome.radius)/(Math.max(dome.radius+.1,hull.outerRadius)-dome.radius)));
  return dome.centre.y - hull.drop * Math.pow(t,hull.profile);
}
export function hullPoint(radius: number, theta: number, dome: DomeConfig, hull: HullConfig): Vec3 {
  return { x: dome.centre.x + radius*Math.sin(theta), y: hullHeight(radius,dome,hull), z: dome.centre.z + radius*Math.cos(theta) };
}
export function hullMesh(dome: DomeConfig, hull: HullConfig) {
  const patches: { points: Vec3[]; radial: number }[] = [];
  const outer = Math.max(dome.radius+.1,hull.outerRadius);
  for(let ring=0;ring<18;ring++) for(let sector=0;sector<128;sector++) {
    const r0=dome.radius+(outer-dome.radius)*ring/18, r1=dome.radius+(outer-dome.radius)*(ring+1)/18;
    const a=sector/128*Math.PI*2,b=(sector+1)/128*Math.PI*2;
    patches.push({radial:ring/18,points:[hullPoint(r0,a,dome,hull),hullPoint(r1,a,dome,hull),hullPoint(r1,b,dome,hull),hullPoint(r0,b,dome,hull)]});
  }
  return patches;
}
