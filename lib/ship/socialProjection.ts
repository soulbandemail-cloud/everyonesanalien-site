import { domeSurfaceFrame } from './domePageLayout';
import type { DomeConfig, Viewport } from './domeGeometry';

export type SocialRect = { left:number; top:number; width:number; height:number };
/** Fixed endpoints: camera progress is the only animation clock for each live link. */
export function socialProjection(rect:SocialRect,index:number,latitude:number,camera:DomeConfig,view:Viewport,progress:number,mobile=false) {
 const t=Math.max(0,Math.min(1,progress));
 const end=domeSurfaceFrame((index-2)*.26,latitude,.14,rect.width,rect.height,camera,view);
 // Enlarge around the projected centre, keeping the same spherical anchors.
 if(mobile) {
  end[4]-=(end[0]*rect.width+end[2]*rect.height)/2;
  end[5]-=(end[1]*rect.width+end[3]*rect.height)/2;
  for(let i=0;i<4;i++)end[i]*=2;
 }
 const start=[1,0,0,1,rect.left,rect.top];
 return start.map((value,i)=>value+(end[i]-value)*t);
}
/** Preserve the existing 24px narrow-screen endpoint without switching size at entry. */
export function socialIconSize(size:number,narrow:boolean,progress:number) {
 return size+((narrow ? 24 : size)-size)*Math.max(0,Math.min(1,progress));
}
