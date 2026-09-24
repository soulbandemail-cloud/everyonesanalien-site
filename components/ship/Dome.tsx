import { curvePath, type DomeConfig, type Viewport } from '@/lib/ship/domeGeometry';
import styles from './ship.module.css';
export function Dome({ config, view, debug }: { config: DomeConfig; view: Viewport; debug: boolean }) {
 return <svg className={styles.dome} width={view.width} height={view.height} aria-hidden="true">
 {debug && <g stroke="#a9dace" strokeOpacity=".18" strokeWidth="1" fill="none" strokeDasharray="3 7">{[.15, .3, .45, .6, .8, 1, 1.2, 1.4].map(phi => <path key={phi} d={curvePath(config, view, phi)} />)}{Array.from({ length: 24 }, (_, i) => <path key={i} d={curvePath(config, view, undefined, i * Math.PI / 12)} />)}</g>}

 </svg>;
}
