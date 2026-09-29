import { domeSurfaceFrame } from './domePageLayout';
import { domePoint, type DomeConfig, type Viewport } from './domeGeometry';

export type SocialRect = { left:number; top:number; width:number; height:number };
/** Fixed endpoints: camera progress is the only animation clock for each live link. */
export function socialProjection(rect:SocialRect,index:number,latitude:number,camera:DomeConfig,view:Viewport,progress:number,mobile=false) {
 const t=Math.max(0,Math.min(1,progress));
 const end=domeSurfaceFrame((index-2)*(mobile ? .30 : .26),latitude,.14,rect.width,rect.height,camera,view);
 // Mobile icons keep their doubled scale, centred on symmetric dome anchors.
 // Use visible SVG dimensions: narrow layouts render 24px inside a 48px link.
 if(mobile) {
  const centre=domePoint((index-2)*.30,latitude,camera,view);
  const width=socialIconSize(rect.width,view.width<760,1);
  const height=socialIconSize(rect.height,view.width<760,1);
  for(let i=0;i<4;i++)end[i]*=2;
  end[4]=centre.x-(end[0]*width+end[2]*height)/2;
  end[5]=centre.y-(end[1]*width+end[3]*height)/2;
 }
 const start=[1,0,0,1,rect.left,rect.top];
 return start.map((value,i)=>value+(end[i]-value)*t);
}
/** Preserve the existing 24px narrow-screen endpoint without switching size at entry. */
export function socialIconSize(size:number,narrow:boolean,progress:number) {
 return size+((narrow ? 24 : size)-size)*Math.max(0,Math.min(1,progress));
}
