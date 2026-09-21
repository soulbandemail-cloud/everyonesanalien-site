import { DEFAULT_DOME, type Vec3 } from './domeGeometry';
import { ROOM } from './roomGeometry';

export type FixturePlacement = { x: number; y: number; z: number; scale: number; yaw: number; widthScale?: number };

export function inwardYaw(position: { x: number; z: number }, centre: { x: number; z: number }) {
  return Math.atan2(position.x - centre.x, position.z - centre.z);
}
/** Keep the rear corners just inside the circular hull, not just the rear midpoint. */
function wallPosition(radius: number, centre: Vec3, angle: number, halfWidth: number, backDepth: number) {
  const radial = Math.sqrt(radius * radius - halfWidth * halfWidth) - backDepth - .07;
  return { x: centre.x + radial * Math.sin(angle), z: centre.z + radial * Math.cos(angle) };
}
export function perimeterFixtures(radius: number, centre: Vec3) {
  const sofaPos = wallPosition(radius, centre, -.90, 1.45 * 1.15, .515 * 1.15);
  const musicPos = wallPosition(radius, centre, .62, 1.5 * .72 * .77, .45 * 1.05);
  const railPos = wallPosition(radius, centre, .91, 1.05 * 1.05, .38 * 1.05);
  const sofaYaw = inwardYaw(sofaPos, centre);
  return {
    radio: { x: -1.65, y: 1.35, z: 7.65, scale: .85, yaw: -.12 },
    sofa: { ...sofaPos, y: ROOM.floorY, scale: 1.15, yaw: sofaYaw },
    // Directly inward of the seat, with a short reachable gap to the circular tabletop.
    coffeeTable: { x: sofaPos.x - 1.79 * Math.sin(sofaYaw), z: sofaPos.z - 1.79 * Math.cos(sofaYaw), y: ROOM.floorY, scale: .9, yaw: sofaYaw },
    musicStation: { ...musicPos, y: ROOM.floorY, scale: 1.05, widthScale: .72 * .77 / 1.05, yaw: inwardYaw(musicPos, centre) },
    clothesRail: { ...railPos, y: ROOM.floorY, scale: 1.05, yaw: inwardYaw(railPos, centre) },
  } satisfies Record<string, FixturePlacement>;
}
export const FIXTURES = perimeterFixtures(DEFAULT_DOME.radius, DEFAULT_DOME.centre);
export function orientedFixtures(centre: Vec3, radius = DEFAULT_DOME.radius) {
  return { ...perimeterFixtures(radius, centre), radio: FIXTURES.radio };
}
