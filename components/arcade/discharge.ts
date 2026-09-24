/** Arcade-only electrical energy and geometry; no clock, DOM or rendering side effects. */
export type Point = { x: number; y: number };
export const TAU = Math.PI * 2;
export const FULL_CHARGE_ANGLE = 5 * TAU;
export const FULL_CHARGE_HEAD_WIDTHS = 32;
const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
const distance = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);

// Mirroring this pattern makes it crackle without changing its arclength/energy cost.
const pattern = Array.from({ length: 9 }, (_, i) => ({ x: i / 8, y: i === 0 || i === 8 ? 0 : (i % 2 ? 1 : -1) * .035 }));
export function pathLength(points: Point[]) {
  return points.slice(1).reduce((sum, point, i) => sum + distance(points[i], point), 0);
}
export const BOLT_LENGTH_FACTOR = pathLength(pattern);
export function boltPath(a: Point, toward: Point, length: number, phase: number): Point[] {
  const d = distance(a, toward);
  if (d === 0 || length <= 0) return [];
  const ux = (toward.x - a.x) / d, uy = (toward.y - a.y) / d;
  const extent = length / BOLT_LENGTH_FACTOR;
  const mirror = Math.floor(phase / 60) % 2 ? -1 : 1;
  return pattern.map(p => ({ x: a.x + extent * (p.x * ux - p.y * uy * mirror), y: a.y + extent * (p.x * uy + p.y * ux * mirror) }));
}

export type Drawing = { pointerId: number; a: Point; toward: Point; headWidth: number; paidLength: number; points: Point[]; lastDraw: number | null; depletedAt: number | null };
export class Discharge {
  charge = 0;
  drawing: Drawing | null = null;
  private orbit: object | null = null;
  private angle = 0;
  private overloadedOrbit: object | null = null;

  /** Absolute rendered angle (including completed iterations). Null stops generation, not storage. */
  sampleOrbit(identity: object | null, angle: number | null) {
    if (!identity || angle === null) { this.orbit = null; this.angle = 0; return false; }
    if (!Number.isFinite(angle) || identity === this.overloadedOrbit) return false;
    if (identity !== this.orbit) { this.orbit = identity; this.angle = 0; }
    const delta = Math.max(0, angle - this.angle);
    this.angle = Math.max(this.angle, angle);
    // Orbit continues visually, but cannot refill a discharge while it is held.
    if (this.drawing) return false;
    const before = this.charge;
    this.charge = clamp(before + delta / FULL_CHARGE_ANGLE);
    // Snap only floating-point roundoff at the mathematical threshold.
    if (1 - this.charge < 1e-12) this.charge = 1;
    if (before < 1 && this.charge === 1) {
      this.charge = 0;
      this.overloadedOrbit = identity;
      return true;
    }
    return false;
  }

  begin(pointerId: number, a: Point, headWidth: number) {
    if (this.drawing || this.charge <= 0 || !Number.isFinite(headWidth) || headWidth <= 0) return false;
    this.drawing = { pointerId, a: {...a}, toward: {...a}, headWidth, paidLength: 0, points: [], lastDraw: null, depletedAt: null };
    return true;
  }
  aim(pointerId: number, toward: Point) {
    if (this.drawing?.pointerId === pointerId) this.drawing.toward = {...toward};
  }
  draw(phase: number) {
    const d = this.drawing;
    if (!d) return;
    const elapsed = d.lastDraw === null ? 0 : Math.max(0, phase - d.lastDraw);
    d.lastDraw = phase;
    // Sustaining a visible bolt drains 75 percentage points per second.
    if (d.points.length) this.charge = clamp(this.charge - elapsed * .00075);
    if (d.depletedAt !== null && phase - d.depletedAt >= 120) { this.end(); return; }
    const capacity = FULL_CHARGE_HEAD_WIDTHS * d.headWidth;
    const requested = distance(d.a, d.toward) * BOLT_LENGTH_FACTOR;
    const length = Math.min(requested, d.paidLength + this.charge * capacity);
    const spent = Math.max(0, length - d.paidLength) / capacity;
    this.charge = clamp(this.charge - spent);
    d.paidLength = Math.max(d.paidLength, length);
    if (this.charge === 0 && d.depletedAt === null) d.depletedAt = phase;
    d.points = boltPath(d.a, d.toward, length, phase);
  }
  end(pointerId?: number) {
    if (pointerId === undefined || this.drawing?.pointerId === pointerId) this.drawing = null;
  }
}

function nearest(p: Point, a: Point, b: Point) {
  const dx = b.x-a.x, dy = b.y-a.y, length2 = dx*dx+dy*dy;
  const t = length2 ? clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/length2) : 0;
  return { x:a.x+t*dx, y:a.y+t*dy };
}
/** Closest point ON the live bolt to a swept head centre; catches middle/corner hits and tunnelling. */
export function hitBolt(from: Point, to: Point, points: Point[], radius: number): Point | null {
  for (let i=1; i<points.length; i++) {
    const a=points[i-1], b=points[i];
    const rx=to.x-from.x, ry=to.y-from.y, sx=b.x-a.x, sy=b.y-a.y;
    const cross=rx*sy-ry*sx;
    if (Math.abs(cross)>1e-10) {
      const qx=a.x-from.x, qy=a.y-from.y;
      const t=(qx*sy-qy*sx)/cross, u=(qx*ry-qy*rx)/cross;
      if(t>=0 && t<=1 && u>=0 && u<=1) return {x:a.x+u*sx,y:a.y+u*sy};
    }
    for (const p of [from,to]) { const q=nearest(p,a,b); if(distance(p,q)<=radius) return q; }
    for (const p of [a,b]) { const q=nearest(p,from,to); if(distance(p,q)<=radius) return p; }
  }
  return null;
}

/** CSS motion follows an ellipse; use its rendered position for partial angular distance,
 * and the animation's iteration count to retain whole turns even across slow frames. */
export function renderedOrbitAngle(iteration: number, progress: number, orbitBox: Pick<DOMRect,'left'|'top'|'width'|'height'>, anchorBox: Pick<DOMRect,'left'|'top'|'width'|'height'>) {
  const x=(orbitBox.left+orbitBox.width/2-anchorBox.left-56)/40;
  const y=(orbitBox.top+orbitBox.height/2-anchorBox.top-48)/21;
  let angle=Math.atan2(y,x);
  if(angle<0) angle+=TAU;
  // The topological seam can have a subpixel sign error at exactly 0/100%.
  if(progress<.001 && angle>TAU-.01) angle=0;
  return iteration*TAU+angle;
}
