import { domePoint, type DomeConfig, type Viewport } from './domeGeometry';

/** Angular layout zones reserve untouched glass below all website content. */
export function domePageLayout(config: DomeConfig) {
  const span = config.topLatitude - config.lowerLatitude;
  return {
    socials: config.topLatitude + .18,
    brand: config.topLatitude,
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
