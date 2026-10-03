import { memo, useId } from 'react';
import { type DomeConfig, type Viewport } from '@/lib/ship/domeGeometry';
import { ROOM, floorPortDiameter, deckOutline, polygonPath } from '@/lib/ship/roomGeometry';
import { hullFloorBoundary } from '@/lib/ship/hullFloorSeam';
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

export const CockpitFloor=memo(function CockpitFloor({ config, view, sharedSeam=false }: { config: DomeConfig; view: Viewport; sharedSeam?:boolean }) {
  const id=useId();
  const boundary=polygonPath(sharedSeam ? hullFloorBoundary(config) : deckOutline(config.radius*2,config.radius*2,ROOM.floorY,config.centre.z),config,view);
  const floorPath=(points:{x:number;y:number;z:number}[])=>polygonPath(points,config,view);
  return <svg className={styles.cockpitFloor} width={view.width} height={view.height} aria-hidden="true">
    <defs>
      <clipPath id={`${id}-floor`}><path d={boundary}/></clipPath>
      <linearGradient id={`${id}-paint`} x2="0" y2="1"><stop stopColor="#304849"/><stop offset=".6" stopColor="#2a4148"/><stop offset="1" stopColor="#253a43"/></linearGradient>
      <radialGradient id={`${id}-warm`}><stop stopColor="#e4b874" stopOpacity=".085"/><stop offset=".45" stopColor="#d4a565" stopOpacity=".035"/><stop offset="1" stopColor="#d4a565" stopOpacity="0"/></radialGradient>
    </defs>
    <path d={boundary} fill={`url(#${id}-paint)`} stroke="#52636a" strokeWidth="2"/>
    <g clipPath={`url(#${id}-floor)`}>
      {Array.from({length:12},(_,i)=>{
        const angle=i/12*Math.PI*2;
        const edge=(r:number)=>({x:ROOM.port.x+r*Math.sin(angle),y:ROOM.floorY,z:ROOM.port.z+r*Math.cos(angle)});
        return <path key={i} d={floorPath([edge(floorPortDiameter/2),edge(24)])} fill="none" stroke="#142e34" strokeOpacity=".65" strokeWidth="1"/>;
      })}
      {[2.5,4.8,7.2].map(radius=><path key={radius} d={floorPath(deckOutline(radius*2,radius*2,ROOM.floorY,ROOM.port.z))} fill="none" stroke="#82918a" strokeOpacity=".22" strokeWidth="1"/>)}
      {Array.from({length:20},(_,i)=>{
        const angle=i/20*Math.PI*2,points=Array.from({length:49},(_,j)=>{
          const t=j/48*Math.PI*2,radial=config.radius-1.05+1.25*Math.cos(t),side=.34*Math.sin(t);
          return {x:config.centre.x+radial*Math.sin(angle)+side*Math.cos(angle),y:ROOM.floorY,z:config.centre.z+radial*Math.cos(angle)-side*Math.sin(angle)};
        });
        return <path key={i} d={floorPath(points)} fill={`url(#${id}-warm)`}/>;
      })}
      {Array.from({length:100},(_,i)=>{
        const x=((i*37)%101)/101*18-9,z=((i*61)%103)/103*18-9;
        return <path key={i} d={floorPath([{x,y:ROOM.floorY,z},{x:x+.04+(i%4)*.025,y:ROOM.floorY,z:z+.07}])} fill="none" stroke={i%2?'#9aab9b':'#142c33'} strokeOpacity=".1" strokeWidth=".65"/>;
      })}
    </g>
  </svg>;
});
