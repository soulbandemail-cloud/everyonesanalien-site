/** World axes: +Y up, +Z forward. World distances in units, latitudes in radians. */
export type Vec3 = { x: number; y: number; z: number };
export type DomeConfig = {
  radius: number;
  centre: Vec3;
  camera: Vec3;
  /** Degrees above horizontal. Independent of camera height and UI latitude. */
  pitch: number;
  /** Vertical FOV on landscape screens; see lens() for portrait framing. */
  fov: number;
  topLatitude: number;
  lowerLatitude: number;
};
export type Viewport = { width: number; height: number };
export const DEFAULT_DOME: DomeConfig = {
  radius: 9.3, centre: { x: 0, y: 0, z: 0 },
  camera: { x: 0, y: 2.8, z: -7 }, pitch: 0, fov: 55,
  topLatitude: .76, lowerLatitude: .085,
};
export const radians = (degrees: number) => degrees * Math.PI / 180;
const stable = (n: number) => Number(n.toFixed(6));

/** Explicit lens shift preserves the previous framing; also shown by the debug cone. */
export function lens(c: DomeConfig, v: Viewport) {
  const focal = Math.min(v.height, v.width * 1.15) / (2 * Math.tan(radians(c.fov) / 2));
  const horizon = v.height * .52;
  return { focal, horizon, upperAngle: Math.atan(horizon / focal), lowerAngle: Math.atan((v.height - horizon) / focal) };
}
export function spherePoint(theta: number, phi: number, c: DomeConfig): Vec3 {
  return {
    x: c.centre.x + c.radius * Math.cos(phi) * Math.sin(theta),
    y: c.centre.y + c.radius * Math.sin(phi),
    z: c.centre.z + c.radius * Math.cos(phi) * Math.cos(theta),
  };
}
export function project(p: Vec3, c: DomeConfig, v: Viewport) {
  const angle = radians(c.pitch);
  const dy = p.y - c.camera.y;
  const dz = p.z - c.camera.z;
  // Dot products against the pitched camera's forward and up basis vectors.
  const depth = Math.sin(angle) * dy + Math.cos(angle) * dz;
  const up = Math.cos(angle) * dy - Math.sin(angle) * dz;
  const { focal, horizon } = lens(c, v);
  const scale = focal / Math.max(.05, depth);
  return {
    x: stable(v.width / 2 + (p.x - c.camera.x) * scale),
    y: stable(horizon - up * scale), depth: stable(depth), scale: stable(scale),
    visible: depth > .1,
  };
}
export function domePoint(theta: number, phi: number, c: DomeConfig, v: Viewport) {
  return project(spherePoint(theta, phi, c), c, v);
}
/** Sample actual spherical curves, splitting at the near plane. */
export function curvePath(c: DomeConfig, v: Viewport, latitude?: number, longitude?: number) {
  let path = ''; let drawing = false;
  for (let i = 0; i <= 360; i++) {
    const p = domePoint(longitude ?? (-Math.PI + i / 360 * Math.PI * 2), latitude ?? (i / 360 * Math.PI / 2), c, v);
    if (!p.visible) { drawing = false; continue; }
    path += `${drawing ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)} `;
    drawing = true;
  }
  return path;
}
