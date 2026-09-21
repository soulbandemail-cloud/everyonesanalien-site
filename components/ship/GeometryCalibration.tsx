import { DEFAULT_DOME, type DomeConfig, type Viewport } from '@/lib/ship/domeGeometry';
import { DEFAULT_HULL, type HullConfig } from '@/lib/ship/hullGeometry';
import { ROOM } from '@/lib/ship/roomGeometry';
import { GeometryProfile } from './GeometryProfile';
import styles from './ship.module.css';

type Props = { hull: HullConfig; onHullChange: (hull: HullConfig) => void; config: DomeConfig; view: Viewport; onChange: (config: DomeConfig) => void; grid: boolean; onGridChange: (value: boolean) => void };
export function GeometryCalibration({ config, view, onChange, grid, onGridChange, hull, onHullChange }: Props) {
  const controls = [
    { label: 'Dome / hull base radius', value: config.radius, min: 8, max: 14, step: .1, unit: 'u', update: (value: number) => ({ ...config, radius: value }) },
    { label: 'Camera depth (Z)', value: config.camera.z, min: -7, max: -1, step: .1, unit: 'u', update: (value: number) => ({ ...config, camera: { ...config.camera, z: value } }) },
    { label: 'Camera height (Y)', value: config.camera.y, min: .4, max: 4, step: .1, unit: 'u', update: (value: number) => ({ ...config, camera: { ...config.camera, y: value } }) },
    { label: 'Camera pitch', value: config.pitch, min: -15, max: 25, step: .5, unit: '°', update: (value: number) => ({ ...config, pitch: value }) },
    { label: 'Field of view', value: config.fov, min: 55, max: 100, step: 1, unit: '°', update: (value: number) => ({ ...config, fov: value }) },
    { label: 'Top latitude', value: config.topLatitude, min: .3, max: 1.1, step: .01, unit: 'rad', update: (value: number) => ({ ...config, topLatitude: value }) },
  ];
  const inside = Math.hypot(config.camera.x - config.centre.x, config.camera.y - config.centre.y, config.camera.z - config.centre.z) < config.radius;
  return <aside className={styles.settings} aria-label="Geometry calibration">
    <strong>GEOMETRY CALIBRATION</strong><p>Saved dome baseline · provisional exterior hull.</p>
    <GeometryProfile config={config} hull={hull} view={view} />
    <div className={styles.calibrationControls}>{controls.map(control => <label key={control.label}>{control.label}<output>{control.value.toFixed(control.step === .005 ? 3 : 2)} {control.unit}</output><input type="range" aria-label={control.label} min={control.min} max={control.max} step={control.step} value={control.value} onChange={event => onChange(control.update(Number(event.target.value)))} /></label>)}</div>
    <div className={styles.calibrationControls}>{([
      { key: 'outerRadius', label: 'Outer saucer radius', min: Math.max(14.2, config.radius + .5), max: 20, step: .1 },
      { key: 'drop', label: 'Upper-hull drop', min: .5, max: 3, step: .1 },
      { key: 'profile', label: 'Hull profile exponent', min: 1.2, max: 3, step: .1 },
    ] as const).map(control => <label key={control.key}>{control.label}<output>{hull[control.key].toFixed(2)}</output><input type="range" aria-label={control.label} min={control.min} max={control.max} step={control.step} value={hull[control.key]} onChange={event => onHullChange({ ...hull, [control.key]: Number(event.target.value) })} /></label>)}</div>
    <label className={styles.gridToggle}><input type="checkbox" checked={grid} onChange={event => onGridChange(event.target.checked)} /> Projected latitude / longitude grid</label>
    <p>Camera {inside ? 'inside' : 'outside'} sphere · Pilot fixed at Z={ROOM.pilotZ}.<br />3 × {ROOM.stepRise}u rise = {(ROOM.stepRise * 3).toFixed(2)}u total.</p>
    {!inside && <p role="status">Camera is outside the sphere: this is not a valid interior viewpoint.</p>}
    <button onClick={() => { onChange(DEFAULT_DOME); onHullChange(DEFAULT_HULL); }}>Reset baseline</button>
  </aside>;
}
