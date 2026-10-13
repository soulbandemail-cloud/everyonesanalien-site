import type {Outfit,ClothesSpin} from '@/lib/ship/clothing';
import {gramophoneWorld} from './RecordProps';
import type {GramophoneScene} from '@/lib/ship/recordRitual';
import {Alien} from './Alien';
import type {CharlieState} from './useCharlieMovement';
import {project,type DomeConfig,type Viewport} from '@/lib/ship/domeGeometry';
import {ROOM} from '@/lib/ship/roomGeometry';
import {orientedFixtures} from '@/lib/ship/fixtureLayout';
import {localPoint} from '@/lib/ship/charlieNavigation';
export function WalkingCharlie({state,config,view,outfit=null,spin,gramophone}:{gramophone?:GramophoneScene;outfit?:Outfit;spin?:ClothesSpin;state:CharlieState;config:DomeConfig;view:Viewport}){
 if(state.mode==='pilot-seated'&&!state.phase)return null;
 const p=project(state.position,config,view);
 if(!p.visible)return null;
 const w=ROOM.alienWidth*p.scale,h=ROOM.alienHeight*p.scale;
 const hands=gramophone&&gramophone.amount>0 ? gramophone.hands.map(target=>{
  if(!target)return undefined;
  const q=project(gramophoneWorld(orientedFixtures(config.centre,config.radius).musicStation,target),config,view);
  const x=(q.x-p.x)*180/w,y=(q.y-p.y+h)*250/h,depth=30;
  const angle=state.yaw*Math.PI/180;
  return {x:x*Math.cos(angle)-depth*Math.sin(angle),y,z:x*Math.sin(angle)+depth*Math.cos(angle)};
 }) : undefined;
 const table=orientedFixtures(config.centre,config.radius).coffeeTable;
 const tablePoint=(x:number,y:number,z:number)=>({...localPoint(table,x,z),y:table.y+y*table.scale});
 // Clip the HTML/canvas layer itself: Safari does not reliably mask a
 // foreignObject through its SVG ancestor.
 const points=[.45,.55].flatMap(y=>Array.from({length:64},(_,i)=>project(tablePoint(1.05*Math.sin(i/32*Math.PI),y,1.05*Math.cos(i/32*Math.PI)),config,view))).sort((a,b)=>a.x-b.x||a.y-b.y);
 const cross=(a:typeof points[number],b:typeof points[number],c:typeof points[number])=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
 const half=(list:typeof points)=>{const h:typeof points=[];for(const p of list){while(h.length>1&&cross(h[h.length-2],h[h.length-1],p)<=0)h.pop();h.push(p);}return h.slice(0,-1);};
 const hull=[...half(points),...half([...points].reverse())];
 const tableCutout='M'+hull.map(p=>p.x+','+p.y).join('L')+'Z';
 const behindTable=state.mode==='sofa-seated'||state.position.z>table.z;
 const clip=behindTable ? `path(evenodd, "M0 0H${view.width}V${view.height}H0Z ${tableCutout}")` : undefined;
 return <div data-charlie-mode={state.mode} style={{position:'absolute',inset:0,zIndex:8,pointerEvents:'none',overflow:'hidden',clipPath:clip}}>
 <svg width={view.width} height={view.height} style={{position:'absolute',inset:0}}><ellipse cx={p.x} cy={p.y} rx={w*.2} ry={h*.025} fill="#000" opacity=".2"/></svg>
 <div style={{position:'absolute',left:p.x-w/2,top:p.y-h*1.32,width:w,height:h*1.4}}>
 <div style={{position:'relative',marginTop:h*.32,width:w,height:h}}>
 <Alien outfit={outfit} spin={spin} ambient={state.mode==='standing'&&!state.phase&&!state.engagement&&state.moving<.02?'standing':undefined} chair={false} attention={{x:0,back:0,down:gramophone&&gramophone.amount>0?.2*gramophone.amount:state.paper>0?.16:state.lookUp?-.3:0}} facing={state.yaw} standing={state.stand>0} motion={{stand:state.stand,gait:state.gait,moving:state.moving,reading:state.paper,ritualHands:hands,ritualReach:gramophone?.reach,ritualAmount:gramophone?.amount}}/>
 </div>
 </div>
 </div>;
}
