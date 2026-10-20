import type {DomeConfig} from './domeGeometry';
import {platformY} from './roomGeometry';
/** A narrow physical station between the arcade and the console. */
export function telescopeStation(c:DomeConfig){
 const base={x:c.centre.x-4.02,y:platformY,z:c.centre.z+7.9};
 const eye={x:base.x+.75,y:base.y+1.53,z:base.z-.92};
 const objective={x:eye.x-1.5,y:eye.y+.64,z:eye.z+1.84};
 // Leave a narrow clearance beside the desk and space behind the eyepiece.
 const approach={x:c.centre.x-3.12,z:c.centre.z+7.95};
 const yaw=Math.atan2(approach.x-objective.x,objective.z-approach.z)*180/Math.PI;
 return {base,eye,objective,approach,yaw};
}
export type TelescopeDirection={x:number;y:number};
export const TELESCOPE_TAP_THRESHOLD=7;
/** Soft mechanical stops: finite travel, with increasing resistance at either end. */
export function telescopeLimit(value:number,limit:number){return limit*Math.tanh(value/limit);}
export function telescopeDrag(dx:number,dy:number,angle:number,scale:number){
 const a=angle*Math.PI/180;
 return {x:(dx*Math.cos(a)+dy*Math.sin(a))/scale,y:(-dx*Math.sin(a)+dy*Math.cos(a))/scale};
}
