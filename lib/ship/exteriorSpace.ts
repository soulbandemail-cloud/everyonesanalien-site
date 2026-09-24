import { lens, project, radians, type DomeConfig, type Viewport } from './domeGeometry';
import { transitionCamera } from './cameraTransition';

// A distant plane, shared by both POVs. Cockpit-scale translation has tiny parallax.
export const EXTERIOR_DEPTH = 10000;
export function exteriorPlane(config: DomeConfig, camera: DomeConfig, view: Viewport) {
  const eye = transitionCamera(config, 0);
  const { focal, horizon } = lens(eye, view);
  const pitch=radians(eye.pitch);
  const point = (x: number, y: number) => {
    const up=(horizon-y)*EXTERIOR_DEPTH/focal;
    return project({
      x: eye.camera.x + (x-view.width/2)*EXTERIOR_DEPTH/focal,
      y: eye.camera.y + up*Math.cos(pitch)+EXTERIOR_DEPTH*Math.sin(pitch),
      z: eye.camera.z + EXTERIOR_DEPTH*Math.cos(pitch)-up*Math.sin(pitch),
    }, camera, view);
  };
  const a=point(0,0), b=point(view.width,0), c=point(0,view.height);
  return `matrix(${(b.x-a.x)/view.width},${(b.y-a.y)/view.width},${(c.x-a.x)/view.height},${(c.y-a.y)/view.height},${a.x},${a.y})`;
}
