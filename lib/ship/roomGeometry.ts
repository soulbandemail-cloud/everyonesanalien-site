import { project, type DomeConfig, type Vec3, type Viewport } from './domeGeometry';

/** Fixed physical layout. Calibration moves the camera, never the pilot toward it. */
export const ROOM = {
  floorY: -.42,
  pilotZ: 7.2,
  stepRise: .08,
  stepCount: 3,
  stepStartZ: 5.9,
  stepRun: .28,
  platformBackZ: 8.55,
  platformBackWidth: 5.8,
  platformFrontWidth: 3.5,
  consoleWidth: 4.8,
  // Locked calibration: lower the surface while its fascia stays anchored to platformY.
  consoleAnchorY: -.45,
  pilotSeatLift: .18,
  furnitureWallClearance: .55,
  alienWidth: 1.45,
  alienHeight: 2.1,
  // One standing alien's shoulder/body clearance, distinct from its oversized head.
  alienBodyWidth: .9,
  port: { x: 0, z: 2, bodyWidthMultiplier: 1.25 },
};
export const floorPortDiameter = ROOM.alienBodyWidth * ROOM.port.bodyWidthMultiplier;
export const platformY = ROOM.floorY + ROOM.stepRise * ROOM.stepCount;
export const pilotPosition: Vec3 = { x: 0, y: platformY, z: ROOM.pilotZ };

/** Elliptical deck outline in a horizontal world plane, symmetric about X=0. */
export function deckOutline(width: number, depth: number, y: number, z: number): Vec3[] {
  return Array.from({ length: 97 }, (_, i) => {
    const t = i / 96 * Math.PI * 2;
    return { x: width / 2 * Math.sin(t), y, z: z + depth / 2 * Math.cos(t) };
  });
}
/** Compact pilot footprint: wide at the console, tapered toward the camera. */
export function pilotDeck(step: number, y: number): Vec3[] {
  const frontZ = ROOM.stepStartZ + step * ROOM.stepRun;
  const frontWidth = ROOM.platformFrontWidth + (2 - step) * .24;
  return [
    { x: -frontWidth / 2, y, z: frontZ },
    { x: frontWidth / 2, y, z: frontZ },
    { x: ROOM.platformBackWidth / 2, y, z: ROOM.platformBackZ },
    { x: -ROOM.platformBackWidth / 2, y, z: ROOM.platformBackZ },
  ];
}

export function polygonPath(points: Vec3[], config: DomeConfig, view: Viewport) {
  // Sutherland–Hodgman clipping against the camera near plane before projection.
  const clipped: Vec3[] = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    const da = project(a, config, view).depth, db = project(b, config, view).depth;
    if (da >= .11) clipped.push(a);
    if ((da >= .11) !== (db >= .11)) {
      const t = (.11 - da) / (db - da);
      clipped.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
    }
  }
  return clipped.map((point, i) => {
    const p = project(point, config, view);
    return `${i ? 'L' : 'M'}${p.x},${p.y}`;
  }).join(' ') + (clipped.length ? ' Z' : '');
}
