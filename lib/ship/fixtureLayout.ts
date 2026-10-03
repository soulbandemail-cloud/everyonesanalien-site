import { DEFAULT_DOME, project, type DomeConfig, type Viewport, type Vec3 } from './domeGeometry';
import { ROOM } from './roomGeometry';
import { COMMAND_DECK } from './commandDeck';

export type FixturePlacement = { x: number; y: number; z: number; scale: number; yaw: number; widthScale?: number };

export function inwardYaw(position: { x: number; z: number }, centre: { x: number; z: number }) {
  return Math.atan2(position.x - centre.x, position.z - centre.z);
}
/** Keep the rear corners just inside the circular hull, not just the rear midpoint. */
function wallPosition(radius: number, centre: Vec3, angle: number, halfWidth: number, backDepth: number) {
  const radial = Math.sqrt(radius * radius - halfWidth * halfWidth) - backDepth - ROOM.furnitureWallClearance;
  return { x: centre.x + radial * Math.sin(angle), z: centre.z + radial * Math.cos(angle) };
}
export function perimeterFixtures(radius: number, centre: Vec3) {
  const sofaPos = wallPosition(radius, centre, -1.04, 1.45 * 1.15, .515 * 1.15);
const arcadePos = wallPosition(radius, centre, -.68, .72, .42);
const railPos = wallPosition(radius, centre, .91 + Math.PI * 2 / 40, 1.05 * 1.05, .38 * 1.05);
const railYaw = inwardYaw(railPos, centre);
const railLeft = railPos.x - 1.05 * 1.05 * Math.cos(railYaw) - .38 * 1.05 * Math.sin(railYaw);
const stageRight = centre.x + radius * Math.sin(4 * Math.PI * 2 / 40);
const musicX = (stageRight + railLeft) / 2;
const musicRadius = Math.sqrt(radius * radius - (1.5 * .72 * .77)**2) - .45 * 1.05 - ROOM.furnitureWallClearance;
const musicPos = wallPosition(radius, centre, Math.asin((musicX-centre.x)/musicRadius), 1.5 * .72 * .77, .45 * 1.05);


// Keep the rail in the rear half of the floor, clear of the music cabinet.
const shiftedRail = wallPosition(radius, centre, 1.09, 1.05 * 1.05, .38 * 1.05);
const sofaYaw = inwardYaw(sofaPos, centre);
const arcadeYaw = inwardYaw(arcadePos, centre);
  return {
    radio: { x: 1.65, y: COMMAND_DECK.panelTop, z: centre.z + Math.sqrt(radius * radius - (1.65-centre.x)**2) - COMMAND_DECK.bankDepth/2, scale: .85, yaw: .12 },
    sofa: { ...sofaPos, y: ROOM.floorY, scale: 1.15, yaw: sofaYaw },
    // Directly inward of the seat, with a short reachable gap to the circular tabletop.
    coffeeTable: { x: sofaPos.x - 1.79 * Math.sin(sofaYaw), z: sofaPos.z - 1.79 * Math.cos(sofaYaw), y: ROOM.floorY, scale: .9, yaw: sofaYaw },
    arcade: {
  ...arcadePos,
  y: ROOM.floorY,
  scale: 1,
  yaw: arcadeYaw,
},
    musicStation: { ...musicPos, y: ROOM.floorY, scale: 1.05, widthScale: .72 * .77 / 1.05, yaw: inwardYaw(musicPos, centre) },
    clothesRail: { ...shiftedRail, y: ROOM.floorY, scale: 1.05, yaw: inwardYaw(shiftedRail, centre) },
  } satisfies Record<string, FixturePlacement>;
}
export const FIXTURES = perimeterFixtures(DEFAULT_DOME.radius, DEFAULT_DOME.centre);
export function orientedFixtures(centre: Vec3, radius = DEFAULT_DOME.radius) {
  return { ...perimeterFixtures(radius, centre), radio: FIXTURES.radio };
}

/** Exact screen plane already used by Fixtures.flatArt for the console TV. */
export function consoleTvScreen(config:DomeConfig,view:Viewport) {
  const f=FIXTURES.radio;
  const p=project({x:f.x-f.scale*.2*Math.sin(f.yaw),y:f.y+f.scale*.26,z:f.z-f.scale*.2*Math.cos(f.yaw)},config,view);
  const scale=p.scale*f.scale*.95/100;
  return {x:p.x-42*scale,y:p.y-18*scale,scale,visible:p.visible};
}
