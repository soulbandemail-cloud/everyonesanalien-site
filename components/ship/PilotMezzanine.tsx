import {useId,type CSSProperties} from 'react';
import { Alien, type Attention } from './Alien';
import { ConsoleDetails } from './ConsoleDetails';
import styles from './ship.module.css';
import { project, type DomeConfig, type Viewport, type Vec3 } from '@/lib/ship/domeGeometry';
import { ROOM, pilotPosition, platformY, polygonPath } from '@/lib/ship/roomGeometry';
import {COMMAND_DECK,commandWall,commandDeck,commandFront,commandStairs} from '@/lib/ship/commandDeck';

type PilotMezzanineProps = {attention:Attention;config:DomeConfig;view:Viewport};
export function PilotMezzanine({ attention, config, view }: PilotMezzanineProps) {
 const id=useId();
 const floorAnchor=project(pilotPosition,config,view);
 const pilot=project({...pilotPosition,y:pilotPosition.y+ROOM.pilotSeatLift},config,view);
 const path=(points:Vec3[])=>polygonPath(points,config,view);
 const deskFront=Array.from({length:33},(_,i)=>{const x=(i/16-1)*COMMAND_DECK.halfWidth;return {x,y:COMMAND_DECK.deskY,z:COMMAND_DECK.deskFrontZ+.16*(x/COMMAND_DECK.halfWidth)**2};});
 const bankPoint=(x:number,y:number)=>{const p=commandWall(x,y,config);return {...p,z:p.z-COMMAND_DECK.bankDepth};};
 const facePoint=(x:number,y:number)=>({x,y,z:COMMAND_DECK.deskFrontZ+.16*(x/COMMAND_DECK.halfWidth)**2});
 const back=Array.from({length:33},(_,i)=>bankPoint(COMMAND_DECK.halfWidth*(1-i/16),COMMAND_DECK.deskY));
 const panel=(x:number,width:number,bottom:number,top:number)=>path([bankPoint(x-width/2,bottom),bankPoint(x+width/2,bottom),bankPoint(x+width/2,top),bankPoint(x-width/2,top)]);
 return <div className={styles.pilotMezzanine}>
 <svg className={styles.platform} width={view.width} height={view.height} role="img" aria-label="Compact curved command deck with a small central three-step staircase">
  <defs><linearGradient id={`${id}-deck`} x2="0" y2="1"><stop stopColor="#425351"/><stop offset="1" stopColor="#2c4045"/></linearGradient><radialGradient id={`${id}-shadow`}><stop stopColor="#030a10" stopOpacity=".65"/><stop offset="1" stopColor="#030a10" stopOpacity="0"/></radialGradient><linearGradient id={`${id}-ambient`}><stop stopColor="#deb884" stopOpacity="0"/><stop offset=".25" stopColor="#deb884" stopOpacity=".035"/><stop offset=".5" stopColor="#deb884" stopOpacity=".075"/><stop offset=".75" stopColor="#deb884" stopOpacity=".035"/><stop offset="1" stopColor="#deb884" stopOpacity="0"/></linearGradient></defs>
  <path d={path([...commandFront(config),...commandFront(config,ROOM.floorY).reverse()])} fill="#263a40"/>
  <path d={path(commandDeck(config))} fill={`url(#${id}-deck)`}/>
  <path d={path(commandDeck(config))} fill={`url(#${id}-ambient)`} pointerEvents="none"/>
  {[{x:0,z:7.2,w:.75,d:.48},{x:0,z:7.5,w:3,d:.5}].map((p,i)=><path key={i} d={path(Array.from({length:49},(_,j)=>({x:p.x+p.w*Math.cos(j/48*Math.PI*2),y:platformY,z:p.z+p.d*Math.sin(j/48*Math.PI*2)})))} fill={`url(#${id}-shadow)`}/>)}
  {commandStairs(config).map(({plane,riser,sides},i)=><g key={i} data-step={i+1}>
   {sides.map((face,j)=><path key={j} d={path(face)} fill="#2c4045"/>)}
   <path d={path(plane)} fill="#405657"/>
   <path d={path(riser)} fill="#203239"/>
   <path d={path(riser)} fill="#050d17" opacity=".24"/>
   <path d={path(plane.slice(0,2))} fill="none" stroke="#c8b38a" strokeOpacity=".28" strokeWidth=".7"/>
  </g>)}

 </svg>
 <svg width={view.width} height={view.height} style={{position:'absolute',inset:0,zIndex:6,pointerEvents:'none'}} role="img" aria-label="Built-in parapet controls and shallow projecting control desk">
  <defs><linearGradient id={`${id}-desk`} x2="0" y2="1"><stop stopColor="#8e8574"/><stop offset=".25" stopColor="#63726b"/><stop offset="1" stopColor="#35474b"/></linearGradient></defs>
  {/* Continuous central parapet bank; nothing outside this compact bay changes. */}
  {/* Solid return cheeks and cap join the deeper bank directly to the parapet. */}
  {[-1,1].map(side=>{const x=side*COMMAND_DECK.halfWidth;return <path key={side} d={path([commandWall(x,platformY,config),bankPoint(x,platformY),bankPoint(x,COMMAND_DECK.panelTop),commandWall(x,COMMAND_DECK.panelTop,config)])} fill="#81776b" stroke="#b9a488" strokeWidth="1"/>;})}
  <path d={path([...Array.from({length:33},(_,i)=>bankPoint((i/16-1)*COMMAND_DECK.halfWidth,COMMAND_DECK.panelTop)),...Array.from({length:33},(_,i)=>commandWall((1-i/16)*COMMAND_DECK.halfWidth,COMMAND_DECK.panelTop,config))])} fill="#9a8b76" stroke="#b9a488" strokeWidth="1"/>

  <path d={panel(0,COMMAND_DECK.halfWidth*2,platformY,COMMAND_DECK.panelTop)} fill="#625d53" stroke="#a7997e" strokeWidth="1.2" />
  {/* Solid fascia reaches the one raised floor; shallow worktop meets the bank. */}
  {[-1,1].map(side=>{const x=side*COMMAND_DECK.halfWidth;return <path key={side} d={path([bankPoint(x,platformY),facePoint(x,platformY),facePoint(x,COMMAND_DECK.deskY),bankPoint(x,COMMAND_DECK.deskY)])} fill="#4c5149" stroke="#ac9d81" strokeWidth="1"/>;})}

  <path d={path([...deskFront,...[...deskFront].reverse().map(p=>({...p,y:platformY}))])} fill="#25373c" stroke="#65746a" strokeWidth="1" />
  <path d={path([...deskFront,...back])} fill={`url(#${id}-desk)`} stroke="#ac9d81" strokeWidth="1.2" />
  {[-2.2,-1.25,-.45,.45,1.25,2.2].map((x,i)=>{
   const z=8.2;
   return <g key={x}>
    <path d={path([{x:x-.31,y:.5,z:z-.22},{x:x+.31,y:.5,z:z-.22},{x:x+.31,y:.5,z:z+.3},{x:x-.31,y:.5,z:z+.3}])} fill="#243936" stroke="#879285" strokeWidth=".7" />
    {[0,1,2].map(n=>{const a=project({x:x+(n-1)*.16,y:.505,z:z-.12},config,view),b=project({x:x+(n-1)*.16,y:.505,z:z+.18},config,view);return <g key={n}><path d={`M${a.x} ${a.y}L${b.x} ${b.y}`} stroke="#10292a" strokeWidth="2"/><circle cx={(a.x+b.x)/2} cy={(a.y+b.y)/2} r="1.15" fill={i%2?'#bfc4aa':'#bdae8d'}/></g>;})}
   </g>;
  })}
  <ConsoleDetails config={config} view={view}/>
  <g pointerEvents="none" fill={`url(#${id}-ambient)`}>
   <path d={panel(0,COMMAND_DECK.halfWidth*2,COMMAND_DECK.deskY,COMMAND_DECK.panelTop)}/>
   <path d={path([...deskFront,...back])}/>
   <path d={path([...deskFront,...[...deskFront].reverse().map(p=>({...p,y:platformY}))])}/>
  </g>
 </svg>
 <div className={styles.pilotOccupant} style={{left:pilot.x,top:pilot.y,width:ROOM.alienWidth*pilot.scale,height:ROOM.alienHeight*pilot.scale,"--seat-lift":`${floorAnchor.y-pilot.y}px`,visibility:pilot.visible?'visible':'hidden'} as CSSProperties}><Alien attention={attention}/></div>
 </div>;
}
