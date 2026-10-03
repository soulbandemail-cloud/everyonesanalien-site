import { memo, useId } from 'react';
import { type DomeConfig, type Viewport } from '@/lib/ship/domeGeometry';
import { ROOM, floorPortDiameter, deckOutline, polygonPath } from '@/lib/ship/roomGeometry';
import { orientedFixtures } from '@/lib/ship/fixtureLayout';
import { commandFront } from '@/lib/ship/commandDeck';
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
  // Shadows are built from solid parts, never from an interactable's bounding box.
  const fixtures=orientedFixtures(config.centre,config.radius);
  const shadows=Object.entries(fixtures).filter(([name])=>name!=='radio').flatMap(([name,f])=>{
    // local x/z centre, half-width/depth and strength; table/rail gaps stay open.
    const parts:Record<string,number[][]>={
      sofa:[[0,-.3,1.55,.95,.9]],
      arcade:[[0,-.2,.64,.65,.95]],
      coffeeTable:[[0,-.18,1.05,1.05,.12],...[-.78,.78].flatMap(x=>[-.27,.27].map(z=>[x,z-.05,.13,.19,.65]))],
      musicStation:[[-1.4,-.12,.16,.55,.6],[1.4,-.12,.16,.55,.6],[0,-.18,1.35,.4,.2]],
      clothesRail:[[-1.05,-.05,.075,.48,.3],[1.05,-.05,.075,.48,.3],[-.15,-.3,.33,.4,.22]],
    };
    return parts[name].map(([cx,cz,w,d,opacity],i)=>({key:`${name}-${i}`,opacity,path:floorPath(Array.from({length:49},(_,j)=>{
      const t=j/48*Math.PI*2,x=(cx+w*Math.cos(t))*f.scale*('widthScale' in f ? f.widthScale : 1),z=(cz+d*Math.sin(t))*f.scale;
      return {x:f.x+x*Math.cos(f.yaw)+z*Math.sin(f.yaw),y:ROOM.floorY,z:f.z+z*Math.cos(f.yaw)-x*Math.sin(f.yaw)};
    }))}));
  });
  return <svg className={styles.cockpitFloor} width={view.width} height={view.height} aria-hidden="true">
    <defs>
      <clipPath id={`${id}-floor`}><path d={boundary}/></clipPath>
      <linearGradient id={`${id}-paint`} x2="0" y2="1"><stop stopColor="#304849"/><stop offset=".6" stopColor="#2a4148"/><stop offset="1" stopColor="#253a43"/></linearGradient>
      <radialGradient id={`${id}-warm`}><stop stopColor="#e4b874" stopOpacity=".32"/><stop offset=".45" stopColor="#d4a565" stopOpacity=".12"/><stop offset="1" stopColor="#d4a565" stopOpacity="0"/></radialGradient>
      <radialGradient id={`${id}-contact`}><stop stopColor="#050c13" stopOpacity=".7"/><stop offset=".55" stopColor="#071018" stopOpacity=".4"/><stop offset="1" stopColor="#071018" stopOpacity="0"/></radialGradient>
      <linearGradient id={`${id}-night`} x2="0" y2="1"><stop stopColor="#070e1b" stopOpacity=".26"/><stop offset="1" stopColor="#050c15" stopOpacity=".08"/></linearGradient>
      <linearGradient id={`${id}-command-width`}><stop stopColor="white" stopOpacity="0"/><stop offset=".25" stopColor="white" stopOpacity=".5"/><stop offset=".5" stopColor="white"/><stop offset=".75" stopColor="white" stopOpacity=".5"/><stop offset="1" stopColor="white" stopOpacity="0"/></linearGradient>
      <linearGradient id={`${id}-command-depth`} x2="0" y2="1"><stop stopColor="#dbb582" stopOpacity=".055"/><stop offset=".35" stopColor="#dbb582" stopOpacity=".025"/><stop offset="1" stopColor="#dbb582" stopOpacity="0"/></linearGradient>
      <mask id={`${id}-command-fade`}><path d={floorPath([{x:-5,y:ROOM.floorY,z:6},{x:5,y:ROOM.floorY,z:6},{x:5,y:ROOM.floorY,z:3.8},{x:-5,y:ROOM.floorY,z:3.8}])} fill={`url(#${id}-command-width)`}/></mask>
      <radialGradient id={`${id}-block`}><stop stopColor="black"/><stop offset=".55" stopColor="black" stopOpacity=".8"/><stop offset="1" stopColor="black" stopOpacity="0"/></radialGradient>
      <mask id={`${id}-spill-occlusion`} maskUnits="userSpaceOnUse" x="0" y="0" width={view.width} height={view.height}>
        <rect width={view.width} height={view.height} fill="white"/>
        {shadows.map(s=><path key={s.key} d={s.path} fill={`url(#${id}-block)`} opacity={s.opacity}/>)}
      </mask>
    </defs>
    <path d={boundary} fill={`url(#${id}-paint)`} stroke="#52636a" strokeWidth="2"/>
    <g clipPath={`url(#${id}-floor)`}>
      <path d={boundary} fill={`url(#${id}-night)`}/>
      {Array.from({length:12},(_,i)=>{
        const angle=i/12*Math.PI*2;
        const edge=(r:number)=>({x:ROOM.port.x+r*Math.sin(angle),y:ROOM.floorY,z:ROOM.port.z+r*Math.cos(angle)});
        return <path key={i} d={floorPath([edge(floorPortDiameter/2),edge(24)])} fill="none" stroke="#142e34" strokeOpacity=".4" strokeWidth="1"/>;
      })}
      {[2.5,4.8,7.2].map(radius=><path key={radius} d={floorPath(deckOutline(radius*2,radius*2,ROOM.floorY,ROOM.port.z))} fill="none" stroke="#82918a" strokeOpacity=".14" strokeWidth="1"/>)}
      <g mask={`url(#${id}-spill-occlusion)`}>
      {Array.from({length:20},(_,i)=>{
        const angle=(i*2+.5)/40*Math.PI*2,points=Array.from({length:49},(_,j)=>{
          const t=j/48*Math.PI*2,radial=config.radius-1.15+1.65*Math.cos(t),side=.65*Math.sin(t);
          return {x:config.centre.x+radial*Math.sin(angle)+side*Math.cos(angle),y:ROOM.floorY,z:config.centre.z+radial*Math.cos(angle)-side*Math.sin(angle)};
        });
        return <path key={i} d={floorPath(points)} fill={`url(#${id}-warm)`}/>;
      })}
      </g>
      <path d={floorPath([{x:-5,y:ROOM.floorY,z:6},{x:5,y:ROOM.floorY,z:6},{x:5,y:ROOM.floorY,z:3.8},{x:-5,y:ROOM.floorY,z:3.8}])} fill={`url(#${id}-command-depth)`} mask={`url(#${id}-command-fade)`}/>
      {shadows.map(s=><path key={s.key} d={s.path} fill={`url(#${id}-contact)`} opacity={s.opacity}/>)}
      <path d={floorPath([...commandFront(config,ROOM.floorY),...commandFront(config,ROOM.floorY).reverse().map(p=>({...p,z:p.z-.32}))])} fill="#07141b" opacity=".22"/>
      {Array.from({length:100},(_,i)=>{
        const x=((i*37)%101)/101*18-9,z=((i*61)%103)/103*18-9;
        return <path key={i} d={floorPath([{x,y:ROOM.floorY,z},{x:x+.04+(i%4)*.025,y:ROOM.floorY,z:z+.07}])} fill="none" stroke={i%2?'#9aab9b':'#142c33'} strokeOpacity=".1" strokeWidth=".65"/>;
      })}
    </g>
  </svg>;
});
