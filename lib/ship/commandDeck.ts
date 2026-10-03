import {type DomeConfig,type Vec3} from './domeGeometry';
import {ROOM,platformY} from './roomGeometry';
export const COMMAND_DECK={halfWidth:2.9,frontHalfWidth:3.9,deskY:.495,deskFrontZ:7.45,panelTop:.925,bankDepth:.55};
export function commandWall(x:number,y:number,c:DomeConfig):Vec3 {
 return {x:c.centre.x+x,y,z:c.centre.z+Math.sqrt(Math.max(0,c.radius*c.radius-x*x))};
}
// Fourth panel seam either side of centre: the full dark platform joins these seams.
export function stageHalfWidth(c:DomeConfig) { return c.radius*Math.sin(4*Math.PI*2/40); }
export function commandFront(c:DomeConfig,y=platformY):Vec3[] {
 const halfWidth=stageHalfWidth(c);
 const end=commandWall(halfWidth,y,c);
 return Array.from({length:35},(_,i)=>{
  const u=i/17-1;
  return {x:c.centre.x+u*halfWidth,y,
   z:ROOM.stepStartZ-.25+(end.z-ROOM.stepStartZ+.25)*u*u};
 });
}
export function commandDeck(c:DomeConfig,y=platformY):Vec3[] {
 return [...commandFront(c,y),...Array.from({length:33},(_,i)=>commandWall(stageHalfWidth(c)*(1-i/16),y,c))];
}

/** Small straight staircase, centred on the pilot; the platform itself stays curved. */
export function commandStairs(c:DomeConfig) {
 const halfWidth=COMMAND_DECK.frontHalfWidth*.25;
 const rise=(platformY-ROOM.floorY)/3,depth=.4;
 const wall=commandWall(COMMAND_DECK.frontHalfWidth,platformY,c);
 const back=ROOM.stepStartZ-.25+(wall.z-ROOM.stepStartZ+.25)*.25**2;
 return Array.from({length:3},(_,i)=>{
  const y=platformY-rise*i,z=back-depth*(i+1);
  const left=c.centre.x-halfWidth,right=c.centre.x+halfWidth;
  const plane=[{x:left,y,z},{x:right,y,z},{x:right,y,z:z+depth},{x:left,y,z:z+depth}];
  const riser=[plane[0],plane[1],{x:right,y:y-rise,z},{x:left,y:y-rise,z}];
  const sides=[left,right].map(x=>[{x,y,z},{x,y,z:z+depth},{x,y:ROOM.floorY,z:z+depth},{x,y:ROOM.floorY,z}]);
  return {y,plane,riser,sides};
 });
}
