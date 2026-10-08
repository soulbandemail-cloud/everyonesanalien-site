import {useId} from 'react';
import {Alien} from './Alien';
import type {CharlieState} from './useCharlieMovement';
import {project,type DomeConfig,type Viewport} from '@/lib/ship/domeGeometry';
import {ROOM,polygonPath} from '@/lib/ship/roomGeometry';
import {orientedFixtures} from '@/lib/ship/fixtureLayout';
import {localPoint} from '@/lib/ship/charlieNavigation';
export function WalkingCharlie({state,config,view}:{state:CharlieState;config:DomeConfig;view:Viewport}){
 const id=useId();
 if(state.mode==='pilot-seated'&&!state.phase)return null;
 const p=project(state.position,config,view);
 if(!p.visible)return null;
 const w=ROOM.alienWidth*p.scale,h=ROOM.alienHeight*p.scale;
 const table=orientedFixtures(config.centre,config.radius).coffeeTable;
 const tablePoint=(x:number,y:number,z:number)=>({...localPoint(table,x,z),y:table.y+y*table.scale});
 // The existing opaque tabletop naturally hides Charlie's lower legs behind it.
 const rim=polygonPath(Array.from({length:65},(_,i)=>tablePoint(1.05*Math.sin(i/64*Math.PI*2),.45,1.05*Math.cos(i/64*Math.PI*2))),config,view);
 const tabletop=polygonPath(Array.from({length:65},(_,i)=>tablePoint(1.05*Math.sin(i/64*Math.PI*2),.55,1.05*Math.cos(i/64*Math.PI*2))),config,view);
 return <svg width={view.width} height={view.height} data-charlie-mode={state.mode} style={{position:'absolute',inset:0,zIndex:8,pointerEvents:'none',overflow:'hidden'}}>
 <defs><mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width={view.width} height={view.height}><rect width={view.width} height={view.height} fill="white"/>{(state.mode==='sofa-seated'||state.position.z>table.z)&&<g fill="black"><path d={rim}/><path d={tabletop}/>{[-.78,.78].flatMap(x=>[-.27,.27].map(z=><path key={`${x}-${z}`} d={polygonPath([tablePoint(x-.045,0,z),tablePoint(x+.045,0,z),tablePoint(x+.045,.48,z),tablePoint(x-.045,.48,z)],config,view)}/>))}</g>}</mask></defs>
 <g mask={`url(#${id})`}>
 <ellipse cx={p.x} cy={p.y} rx={w*.2} ry={h*.025} fill="#000" opacity=".2"/>
 <foreignObject x={p.x-w/2} y={p.y-h*1.32} width={w} height={h*1.4}>
 <div style={{position:'relative',marginTop:h*.32,width:w,height:h}}>
 <Alien chair={false} attention={{x:0,back:0,down:state.paper>0?.16:state.lookUp?-.3:0}} facing={state.yaw} standing={state.stand>0} motion={{stand:state.stand,gait:state.gait,moving:state.moving,reading:state.paper}}/>
 </div>
 </foreignObject>
 </g></svg>;
}
