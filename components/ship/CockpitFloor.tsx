import { type DomeConfig, type Viewport } from '@/lib/ship/domeGeometry';
import { ROOM, floorPortDiameter, deckOutline, polygonPath } from '@/lib/ship/roomGeometry';
import styles from './ship.module.css';

export function ManifestationPort({ config, view }: { config: DomeConfig; view: Viewport }) {
  const port = ROOM.port;
  const radius = floorPortDiameter / 2;
  const centre = { x: port.x, y: ROOM.floorY, z: port.z };
  const edge = (angle: number) => ({
    x: centre.x + radius * Math.sin(angle),
    y: ROOM.floorY,
    z: centre.z + radius * Math.cos(angle),
  });
  return <svg className={styles.manifestationPort} width={view.width} height={view.height} role="img" aria-label="Floor port / tractor-beam airlock: closed segmented hatch, flush with the floor">
    <title>Floor port — closed; one alien or manifested object</title>
    {/* Closed doors share the floor plane exactly. No raised rim, aperture or active beam. */}
    <path d={polygonPath(deckOutline(floorPortDiameter, floorPortDiameter, ROOM.floorY, port.z), config, view)} fill="#2c3d46" stroke="#697a80" strokeWidth="1" />
    {Array.from({ length: 6 }, (_, i) => <path key={i} d={polygonPath([centre, edge(i * Math.PI / 3)], config, view)} fill="none" stroke="#172730" strokeWidth="1" />)}
  </svg>;
}

export function CockpitFloor({ config, view }: { config: DomeConfig; view: Viewport }) {
  return <svg className={styles.cockpitFloor} width={view.width} height={view.height} aria-hidden="true">
      <path d={polygonPath(deckOutline(config.radius * 2, config.radius * 2, ROOM.floorY, config.centre.z), config, view)} fill="#25353f" stroke="#52636a" strokeWidth="2" />
  </svg>;
}
