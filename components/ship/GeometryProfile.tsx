import { lens, radians, type DomeConfig, type Viewport } from '@/lib/ship/domeGeometry';
import { hullHeight, type HullConfig } from '@/lib/ship/hullGeometry';
import { ROOM, platformY } from '@/lib/ship/roomGeometry';
import styles from './ship.module.css';

export function GeometryProfile({ config: c, view, hull }: { config: DomeConfig; view: Viewport; hull: HullConfig }) {
  // Equal units on both axes: the hemisphere is never visually stretched.
  const scale = 370 / (Math.max(c.radius, hull.outerRadius) * 2 + 4);
  const x = (z: number) => 210 + (z - c.centre.z) * scale;
  const y = (height: number) => 253 - (height - c.centre.y) * scale;
  const cx = x(c.camera.z), cy = y(c.camera.y);
  const reach = c.radius * 1.8;
  const ray = (angle: number) => ({ x: x(c.camera.z + Math.cos(angle) * reach), y: y(c.camera.y + Math.sin(angle) * reach) });
  const optics = lens(c, view);
  const upper = ray(radians(c.pitch) + optics.upperAngle);
  const lower = ray(radians(c.pitch) - optics.lowerAngle);
  const forward = ray(radians(c.pitch));
  const dome = Array.from({ length: 101 }, (_, i) => {
    const t = Math.PI * i / 100;
    return `${i ? 'L' : 'M'}${x(c.centre.z - c.radius * Math.cos(t)).toFixed(3)},${y(c.centre.y + c.radius * Math.sin(t)).toFixed(3)}`;
  }).join(' ');
  return <figure className={styles.profile}>
    <figcaption>SIDE PROFILE · Y / Z · equal scale</figcaption>
    <svg viewBox="0 0 420 315" role="img" aria-label="Live side profile: hemisphere, hull plane, sphere centre, exterior upper hull and hidden belt, cockpit-view camera, look direction, field-of-view cone, pilot eye and upper latitude">
      <defs><clipPath id="profile-clip"><rect x="8" y="15" width="404" height="272" /></clipPath></defs>
      <g clipPath="url(#profile-clip)">
        <path d={`M${cx},${cy} L${upper.x},${upper.y} L${lower.x},${lower.y} Z`} fill="#d6b16c" fillOpacity=".08" />
        <path d={`M${upper.x},${upper.y} L${cx},${cy} L${lower.x},${lower.y}`} fill="none" stroke="#b4a175" strokeDasharray="3 4" />
        <path d={dome} fill="none" stroke="#c9e7e2" strokeWidth="1.5" />
        <line x1={x(c.centre.z - c.radius)} x2={x(c.centre.z + c.radius)} y1={y(c.centre.y)} y2={y(c.centre.y)} stroke="#9bafb8" />
        <line x1={x(c.centre.z - c.radius)} x2={x(c.centre.z + c.radius)} y1={y(ROOM.floorY)} y2={y(ROOM.floorY)} stroke="#667985" />
        {[{ phi: c.topLatitude, label: 'TOP latitude', color: '#ffb0ff' }].map(({ phi, label, color }) => {
          const height = c.centre.y + c.radius * Math.sin(phi);
          const radius = c.radius * Math.cos(phi);
          return <g key={label} stroke={color}><line x1={x(c.centre.z - radius)} x2={x(c.centre.z + radius)} y1={y(height)} y2={y(height)} strokeDasharray="5 3" /><text x={x(c.centre.z - radius) + 4} y={y(height) - 5} stroke="none" fill={color}>{label}</text></g>;
        })}
        {[-1,1].map(side => {
          const points = Array.from({length:65},(_,i) => {
            const radius = c.radius+(hull.outerRadius-c.radius)*i/64;
            return `${i ? 'L' : 'M'}${x(c.centre.z+side*radius)},${y(hullHeight(radius,c,hull))}`;
          }).join(' ');
          return <g key={side}><path d={points} fill="none" stroke="#d4dce4" strokeWidth="3" /><circle cx={x(c.centre.z+side*hull.outerRadius)} cy={y(c.centre.y-hull.drop)} r="3" fill="#d4dce4" /><rect x={x(c.centre.z+side*hull.outerRadius)-3} y={y(c.centre.y-hull.drop)+4} width="6" height="5" fill="none" stroke="#7fffd4" strokeDasharray="2 2" /></g>;
        })}
        <text x="14" y="40" fill="#d4dce4">Silver: exterior upper hull / outer rim</text>
        <text x="14" y="55" fill="#7fffd4">Dashed: exterior belt (hidden in cockpit)</text>
        <line x1={cx} y1={cy} x2={forward.x} y2={forward.y} stroke="#ffd38a" />
        <circle cx={cx} cy={cy} r="4" fill="#ffd38a" />
        <text x={cx - 7} y={cy - 12} fill="#ffd38a">Camera → look</text>
        <circle cx={x(c.centre.z)} cy={y(c.centre.y)} r="3" fill="white" />
        <path d={`M${x(ROOM.stepStartZ + 2 * ROOM.stepRun)},${y(platformY)} H${x(ROOM.platformBackZ)}`} stroke="#a4c9ff" strokeWidth="3" />
        {[0, 1, 2].map(i => <path key={i} d={`M${x(ROOM.stepStartZ + i * ROOM.stepRun)},${y(ROOM.floorY + i * ROOM.stepRise)} V${y(ROOM.floorY + (i + 1) * ROOM.stepRise)} H${x(ROOM.stepStartZ + (i + 1) * ROOM.stepRun)}`} fill="none" stroke="#a4c9ff" />)}
        <line x1={x(ROOM.pilotZ)} x2={x(ROOM.pilotZ)} y1={y(platformY)} y2={y(platformY + ROOM.alienHeight + ROOM.pilotSeatLift)} stroke="#a4c9ff" strokeWidth="3" />
        <line x1={x(ROOM.pilotZ)} x2={x(ROOM.pilotZ) - 60} y1={y(platformY + 1)} y2={y(platformY + 2.6)} stroke="#a4c9ff" />
        <circle cx={x(ROOM.pilotZ)} cy={y(platformY + ROOM.alienHeight - .3 + ROOM.pilotSeatLift)} r="3" fill="#a4c9ff" />
        <text x={x(ROOM.pilotZ)-95} y={y(platformY + ROOM.alienHeight + .7)} fill="#a4c9ff">Pilot eye / chair</text>
        <text x={x(ROOM.pilotZ) - 140} y={y(platformY + 2.6)} fill="#a4c9ff">Pilot mezzanine</text>
      </g>
      <text x="14" y="20" fill="#d6b16c">Viewport cone: {((optics.upperAngle + optics.lowerAngle) * 180 / Math.PI).toFixed(1)}°</text>
      <text x="14" y="282" fill="#c9d3d8">Base / centre: Y={c.centre.y} · Floor: Y={ROOM.floorY}</text>
      <text x="14" y="302" fill="#c9d3d8">Rear −Z ← · Centre Z={c.centre.z} · → Forward +Z</text>
    </svg>
    <p>Dashed coloured lines are side-on latitude circles. Blue marks the pilot and platform. Amber is the actual viewport cone, including portrait framing and the existing 52% lens centre.</p>
  </figure>;
}
