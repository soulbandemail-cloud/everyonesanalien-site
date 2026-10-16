import {commandWall,COMMAND_DECK} from './commandDeck';
import {orientedFixtures} from './fixtureLayout';
import type {DomeConfig,Vec3} from './domeGeometry';
export type Plant='desk-plant'|'floor-plant';
export type WateringScene={plant:Plant;elapsed:number};
export const WATERING_DURATION=3.8;
export function plantSoil(plant:Plant,c:DomeConfig):Vec3{
 if(plant==='desk-plant'){const p=commandWall(-2.82,COMMAND_DECK.panelTop+.57*(1-34/50),c);return {...p,x:p.x+.19,z:p.z-.26};}
 const f=orientedFixtures(c.centre,c.radius).sofa,x=-1.62,z=-.12;
 return {x:f.x+f.scale*(x*Math.cos(f.yaw)+z*Math.sin(f.yaw)),y:f.y+.8*.42*1.45*f.scale,z:f.z+f.scale*(z*Math.cos(f.yaw)-x*Math.sin(f.yaw))};
}
const ease=(n:number)=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n);};
export function wateringFrame(scene:WateringScene,c:DomeConfig,position:Vec3){
 const t=scene.elapsed,soil=plantSoil(scene.plant,c),side=scene.plant==='desk-plant'?1:-1;
 const raise=ease((t-.12)/.7)*(1-ease((t-3.05)/.6)),tilt=ease((t-.8)/.35)*(1-ease((t-2.75)/.3));
 const amount=ease(t/.16)*(1-ease((t-3.55)/.25));
 const pouring=t>=1.15&&t<2.75;
 const canScale=.015+.985*raise;
 const tip={x:soil.x,y:soil.y+.20,z:soil.z};
 // Rotate about the spout tip: pouring can never wander outside the pot.
 // Lift the vessel behind the fixed tip until the spout slopes down into the soil.
 const angle=-tilt*.55;
 const point=(x:number,y:number,z=0):Vec3=>{
  // Grow from the handle grip so the can stays attached to his hand.
  x=-.69+(x+.69)*canScale;y=.26+(y-.26)*canScale;z*=canScale;
  const dx=side*(x*Math.cos(angle)-y*Math.sin(angle)),dy=x*Math.sin(angle)+y*Math.cos(angle);
  const raised={x:tip.x+dx,y:tip.y+dy,z:tip.z+z};
  const resting={x:position.x+side*.28+dx+.5*side,y:position.y+.72+dy,z:position.z-.15+z};
  return {x:resting.x+(raised.x-resting.x)*raise,y:resting.y+(raised.y-resting.y)*raise,z:resting.z+(raised.z-resting.z)*raise};
 };
 return {soil,point,amount,canScale,pouring,tilt,wiggle:pouring?Math.sin((t-1.15)*8)*1.6:0,hands:[point(-.67,-.22,-.03),point(-.69,.34,-.03)],done:t>=WATERING_DURATION};
}
export const plantLabel=(plant:Plant)=>plant==='desk-plant'?'Water desk plant':'Water floor plant';
