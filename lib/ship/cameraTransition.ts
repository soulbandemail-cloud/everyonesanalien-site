import { type DomeConfig } from './domeGeometry';
import { ROOM, platformY } from './roomGeometry';

export const CAMERA_DURATION = 1800;
export function cameraDuration(reducedMotion: boolean, hidden: boolean) {
  return reducedMotion || hidden ? 0 : CAMERA_DURATION;
}
/** The seated alien's forward eye position; the endpoint is exactly the locked camera. */
export function transitionCamera(end: DomeConfig, progress: number): DomeConfig {
  const t = Math.max(0, Math.min(1, progress));
  if (t === 1) return end;
  const eye = { x: 0, y: platformY + ROOM.pilotSeatLift + ROOM.alienHeight * .68, z: ROOM.pilotZ + .15 };
  return { ...end, camera: {
    x: eye.x + (end.camera.x-eye.x)*t,
    y: eye.y + (end.camera.y-eye.y)*t,
    z: eye.z + (end.camera.z-eye.z)*t,
  } };
}
