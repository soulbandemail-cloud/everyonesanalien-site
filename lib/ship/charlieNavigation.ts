import {lens,radians,type DomeConfig,type Viewport,type Vec3} from './domeGeometry';
import {orientedFixtures,type FixturePlacement} from './fixtureLayout';
import {ROOM,pilotPosition,platformY} from './roomGeometry';
import {commandFront,commandStairs,COMMAND_DECK} from './commandDeck';
export type Point={x:number;z:number};
export type Destination='chair'|'merch'|'shows'|'tv'|'newsletter'|'arcade';
export type CharlieMode='pilot-seated'|'sofa-seated'|'walking'|'standing';
export type Arrival={point:Point;yaw:number;mode:CharlieMode;seat?:Vec3;lookUp?:boolean;retainHeading?:boolean};
export const clearance=.42;
export function localPoint(f:FixturePlacement,x:number,z:number):Point{return {x:f.x+f.scale*(x*Math.cos(f.yaw)+z*Math.sin(f.yaw)),z:f.z+f.scale*(z*Math.cos(f.yaw)-x*Math.sin(f.yaw))};}
export function approaches(c:DomeConfig):Record<Destination,Arrival>{
 const f=orientedFixtures(c.centre,c.radius);
 const facing=(p:Point,q:Point)=>Math.atan2(p.x-q.x,q.z-p.z)*180/Math.PI;
 const approach=(fixture:FixturePlacement,x:number,z:number):Arrival=>{const point=localPoint(fixture,x,z);return {point,yaw:facing(point,fixture),mode:'standing'};};
 const sofa=approach(f.sofa,.95,-1.1),seat=localPoint(f.sofa,-.43,-.07);
 return {chair:{point:{x:0,z:6.55},yaw:0,mode:'pilot-seated'},tv:{point:{x:.95,z:6.65},yaw:facing({x:.95,z:6.65},f.radio),mode:'standing'},merch:approach(f.clothesRail,0,-1),arcade:approach(f.arcade,0,-1.18),shows:{...approach(f.sofa,.9,-1.55),lookUp:true},newsletter:{...sofa,mode:'sofa-seated',yaw:180-f.sofa.yaw*180/Math.PI,seat:{...seat,y:ROOM.floorY+.59*f.sofa.scale-.4}}};
}
export function stageFrontZ(x:number,c:DomeConfig){const edge=commandFront(c),half=edge[edge.length-1].x-c.centre.x;return ROOM.stepStartZ-.25+(edge[edge.length-1].z-ROOM.stepStartZ+.25)*((x-c.centre.x)/half)**2;}
export function groundHeight(p:Point,c:DomeConfig){
 const stairs=commandStairs(c);
 if(Math.abs(p.x-c.centre.x)<.975){for(const stair of stairs)if(p.z>=stair.plane[0].z&&p.z<=stair.plane[2].z)return stair.y;}
 return p.z>=stageFrontZ(p.x,c)?platformY:ROOM.floorY;
}
export function walkable(p:Point,c:DomeConfig){
 if(Math.hypot(p.x-c.centre.x,p.z-c.centre.z)>c.radius-.65||p.z<c.camera.z+.8)return false;
 const f=orientedFixtures(c.centre,c.radius);
 const box=(fixture:FixturePlacement,cx:number,cz:number,w:number,d:number)=>{
  const dx=p.x-fixture.x,dz=p.z-fixture.z,x=(dx*Math.cos(fixture.yaw)-dz*Math.sin(fixture.yaw))/fixture.scale,z=(dx*Math.sin(fixture.yaw)+dz*Math.cos(fixture.yaw))/fixture.scale;
  return Math.abs(x-cx)<w/2+clearance/fixture.scale&&Math.abs(z-cz)<d/2+clearance/fixture.scale;
 };
 if(box(f.sofa,-.43,-.03,2,1.09)||box(f.arcade,0,0,1.1,1.2)||box(f.musicStation,0,0,1.58,.95)||box(f.clothesRail,0,0,2.1,.76)||box(f.sofa,-1.62,-.12,.65,.65))return false;
 if(Math.hypot(p.x-f.coffeeTable.x,p.z-f.coffeeTable.z)<1.05*f.coffeeTable.scale+clearance)return false;
 if(Math.abs(p.x-c.centre.x)<COMMAND_DECK.halfWidth+clearance&&p.z>COMMAND_DECK.deskFrontZ-clearance)return false;
 if(Math.hypot(p.x-pilotPosition.x,p.z-pilotPosition.z)<.43)return false;
 // The platform is entered through the staircase, never through its solid side face.
 if(Math.abs(p.x-c.centre.x)>.975-clearance&&Math.abs(p.z-stageFrontZ(p.x,c))<clearance)return false;
 return true;
}
export function clearSegment(a:Point,b:Point,c:DomeConfig){const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.08));for(let i=0;i<=n;i++)if(!walkable({x:a.x+(b.x-a.x)*i/n,z:a.z+(b.z-a.z)*i/n},c))return false;return true;}
export function findPath(start:Point,end:Point,c:DomeConfig):Point[]|null{
 if(!walkable(start,c)||!walkable(end,c))return null;
 if(clearSegment(start,end,c))return [end];
 const step=.2,key=(p:Point)=>`${Math.round(p.x/step)},${Math.round(p.z/step)}`,point=(k:string)=>{const [x,z]=k.split(',').map(Number);return {x:x*step,z:z*step};};
 const first=key(start),open=new Set([first]),cost=new Map([[first,0]]),from=new Map<string,string>();
 let count=0;
 while(open.size&&count++<18000){
  let best='',score=Infinity;for(const k of open){const p=point(k),v=cost.get(k)!+Math.hypot(end.x-p.x,end.z-p.z);if(v<score){score=v;best=k;}}
  open.delete(best);const p=best===first?start:point(best);
  if(Math.hypot(p.x-end.x,p.z-end.z)<.35&&clearSegment(p,end,c)){
   const route=[end,p];let k=best;while(from.has(k)){k=from.get(k)!;route.push(k===first?start:point(k));}route.reverse();
   const smooth:Point[]=[];let i=0;while(i<route.length-1){let j=route.length-1;while(j>i+1&&!clearSegment(route[i],route[j],c))j--;smooth.push(route[j]);i=j;}return smooth;
  }
  for(const dx of [-1,0,1])for(const dz of [-1,0,1]){if(!dx&&!dz)continue;const q={x:Math.round(p.x/step)*step+dx*step,z:Math.round(p.z/step)*step+dz*step},k=key(q);if(!clearSegment(p,q,c))continue;const g=cost.get(best)!+Math.hypot(q.x-p.x,q.z-p.z);if(g<(cost.get(k)??Infinity)){cost.set(k,g);from.set(k,best);open.add(k);}}
 }
 return null;
}
export function floorPoint(x:number,y:number,c:DomeConfig,v:Viewport):Point|null{
 const {focal,horizon}=lens(c,v),up=(horizon-y)/focal,a=radians(c.pitch),dy=up*Math.cos(a)+Math.sin(a),dz=Math.cos(a)-up*Math.sin(a);
 if(dy>=-.0001)return null;
 for(const height of [platformY,...commandStairs(c).map(s=>s.y),ROOM.floorY]){
  const t=(height-c.camera.y)/dy,p={x:c.camera.x+(x-v.width/2)/focal*t,z:c.camera.z+dz*t};
  if(t>0&&Math.abs(groundHeight(p,c)-height)<.00001)return p;
 }
 return null;
}
