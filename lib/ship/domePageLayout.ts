import { domePoint, type DomeConfig, type Viewport } from './domeGeometry';

/** Angular layout zones reserve untouched glass below all website content. */
export function domePageLayout(config: DomeConfig) {
  const span = config.topLatitude - config.lowerLatitude;
  return {
    socials: config.topLatitude + .24,
    brand: config.topLatitude,
    caption: config.topLatitude + .12,
    captionWidth: .52,
    information: config.lowerLatitude + span * .66,
    merch: config.lowerLatitude + span * .46,
    posterBottom: config.lowerLatitude + .045,
    posterTop: config.lowerLatitude + span * .32,
    wordmarkGap: .39,
  };
}
/** Same latitude circle, with an angular gap centred on the forward axis. */
export function upperRulePath(config: DomeConfig, view: Viewport) {
  const gap = domePageLayout(config).wordmarkGap;
  let d = '', drawing = false;
  for (let i = 0; i <= 720; i++) {
    const theta = -Math.PI + i / 720 * Math.PI * 2;
    const p = domePoint(theta, config.topLatitude, config, view);
    if (Math.abs(theta) < gap || !p.visible) { drawing = false; continue; }
    d += `${drawing ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)} `;
    drawing = true;
  }
  return d;
}

/** Three spherical samples define a local live-DOM surface patch, not a guessed CSS tilt. */
export function domeSurfaceFrame(theta: number, phi: number, angularWidth: number, width: number, height: number, config: DomeConfig, view: Viewport) {
  const angularHeight=angularWidth*height/width*Math.cos(phi);
  const a=domePoint(theta-angularWidth/2,phi+angularHeight/2,config,view);
  const b=domePoint(theta+angularWidth/2,phi+angularHeight/2,config,view);
  const c=domePoint(theta-angularWidth/2,phi-angularHeight/2,config,view);
  return [(b.x-a.x)/width,(b.y-a.y)/width,(c.x-a.x)/height,(c.y-a.y)/height,a.x,a.y];
}
