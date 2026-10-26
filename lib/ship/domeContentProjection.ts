import {domePoint,type DomeConfig,type Viewport} from './domeGeometry';

/** A compact angular chart on the actual glass sphere. Normalise its central
 * magnification to retain the established shopfront layout and readable scale. */
export function domeContentMap(config:DomeConfig,view:Viewport){
 const cx=view.width/2,cy=view.height*.22,epsilon=.0001,chartScale=.22;
 let lo=-1.3,hi=1.3;
 for(let i=0;i<40;i++){const mid=(lo+hi)/2;if(domePoint(0,mid,config,view).y>cy)lo=mid;else hi=mid;}
 const phi=(lo+hi)/2,origin=domePoint(0,phi,config,view);
 const dx=(domePoint(epsilon,phi,config,view).x-domePoint(-epsilon,phi,config,view).x)/(2*epsilon);
 const dy=(domePoint(0,phi+epsilon,config,view).y-domePoint(0,phi-epsilon,config,view).y)/(2*epsilon);
 const raw=(x:number,y:number)=>{
  const p=domePoint((x-cx)*chartScale/dx,phi+(y-cy)*chartScale/dy,config,view);
  return {x:cx+(p.x-origin.x)/chartScale,y:cy+(p.y-origin.y)/chartScale};
 };
 // Fit the projected chart into its original glass area, so high outer-latitude
 // content stays inside the viewport. This is one shared viewport transform.
 const height=view.height*.65;
 const corners=[0,cx,view.width].flatMap(x=>[0,height/2,height].map(y=>raw(x,y)));
 const left=Math.min(...corners.map(p=>p.x)),right=Math.max(...corners.map(p=>p.x));
 const top=Math.min(...corners.map(p=>p.y)),bottom=Math.max(...corners.map(p=>p.y));
 return (x:number,y:number)=>{const p=raw(x,y);return {x:(p.x-left)*view.width/(right-left),y:(p.y-top)*height/(bottom-top)};};
}
