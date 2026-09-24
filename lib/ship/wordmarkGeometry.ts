import { domePageLayout, domeSurfaceFrame } from './domePageLayout';
import type { DomeConfig, Viewport } from './domeGeometry';

export type Point2 = { x:number; y:number };
export type Frame = [number,number,number,number,number,number];
export type Ink = { width:number; height:number; points:Point2[] };
export type Bounds = { left:number; right:number; top:number; bottom:number };
export const RING = { rx:88, ry:25, stroke:9, angle:-18*Math.PI/180 };
const curves = [
 [[0,52],[-13,34],[-49,12],[-49,-15]],
 [[-49,-15],[-49,-48],[-12,-53],[0,-28]],
 [[0,-28],[12,-53],[49,-48],[49,-15]],
 [[49,-15],[49,12],[13,34],[0,52]],
];
export const REAL_HEART_PATH = 'M0 52 '+curves.map(c=>'C'+c.slice(1).map(p=>p.join(' ')).join(' ')).join(' ')+'Z';
function cubicValues(p:number[]) {
 const [a,b,c,d]=p, A=-a+3*b-3*c+d, B=2*(a-2*b+c), C=b-a;
 const roots=Math.abs(A)<1e-10 ? [-C/B] : [(-B+Math.sqrt(B*B-4*A*C))/(2*A),(-B-Math.sqrt(B*B-4*A*C))/(2*A)];
 return [a,d,...roots.filter(t=>t>0 && t<1).map(t=>(1-t)**3*a+3*(1-t)**2*t*b+3*(1-t)*t*t*c+t**3*d)];
}
const ringX=Math.hypot(RING.rx*Math.cos(RING.angle),RING.ry*Math.sin(RING.angle))+RING.stroke/2;
const ringY=Math.hypot(RING.rx*Math.sin(RING.angle),RING.ry*Math.cos(RING.angle))+RING.stroke/2;
const heartY=curves.flatMap(c=>cubicValues(c.map(p=>p[1])));
/** Tight painted silhouette bounds; transparent SVG padding never enters the layout. */
export const PLANET_INK = { left:-ringX,right:ringX,top:Math.min(-ringY,...heartY.map(y=>y-.3)),bottom:Math.max(ringY,...heartY.map(y=>y+.3)) };
export function transformedBounds(points:Point2[],m:Frame):Bounds {
 const xs=points.map(p=>m[0]*p.x+m[2]*p.y+m[4]);
 const ys=points.map(p=>m[1]*p.x+m[3]*p.y+m[5]);
 return {left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys)};
}
export function ringBounds(m:Frame,scale:number):Bounds {
 const [a,b,c,d,e,f]=m, {rx,ry,stroke,angle}=RING;
 const cx=e-scale*(a*PLANET_INK.left+c*PLANET_INK.top);
 const cy=f-scale*(b*PLANET_INK.left+d*PLANET_INK.top);
 const extent=(u:number,v:number)=>scale*(Math.hypot(rx*(u*Math.cos(angle)+v*Math.sin(angle)),ry*(-u*Math.sin(angle)+v*Math.cos(angle)))+stroke/2*Math.hypot(u,v));
 return {left:cx-extent(a,c),right:cx+extent(a,c),top:cy-extent(b,d),bottom:cy+extent(b,d)};
}
const identity:Frame=[1,0,0,1,0,0];
function interpolate(a:Frame,b:Frame,t:number):Frame { return a.map((v,i)=>v+(b[i]-v)*t) as Frame; }
function inkFrame(ink:Ink,theta:number,config:DomeConfig,view:Viewport,perPixel:number):Frame {
 const box=transformedBounds(ink.points,identity),w=box.right-box.left,h=box.bottom-box.top;
 const m=domeSurfaceFrame(theta,domePageLayout(config).brand,w*perPixel,w,h,config,view) as Frame;
 m[4]-=m[0]*box.left+m[2]*box.top;m[5]-=m[1]*box.left+m[3]*box.top;
 return m;
}
/** A single ink gap, solved against the actual projected silhouettes on every frame. */
export function wordmarkFrames(glyphs:Ink[],fontSize:number,centreY:number,config:DomeConfig,view:Viewport,progress:number) {
 const t=Math.max(0,Math.min(1,progress)),centre=view.width/2;
 const boxes=glyphs.map(g=>transformedBounds(g.points,identity));
 const height=Math.max(...boxes.map(b=>b.bottom-b.top));
 const planetScale=height/(PLANET_INK.bottom-PLANET_INK.top);
 const planetWidth=(PLANET_INK.right-PLANET_INK.left)*planetScale;
 const gap=fontSize*.26;
 const widths=boxes.map(b=>b.right-b.left);
 // Retain the established letter scale as the O shrinks.
 const perPixel=domePageLayout(config).wordmarkHalfWidth*2/(fontSize*4.6);
 const firstO:Frame=[1,0,0,1,centre-planetWidth/2,centreY-height/2];
 const targetO=domeSurfaceFrame(0,domePageLayout(config).brand,planetWidth*perPixel,planetWidth,height,config,view) as Frame;
 const targetRing=ringBounds(targetO,planetScale);
 targetO[4]+=centre-(targetRing.left+targetRing.right)/2;
 const O=interpolate(firstO,targetO,t),ring=ringBounds(O,planetScale);
 const X=gap*((1-t)+t*Math.hypot(targetO[0],targetO[1]));
 const firstEdges=[centre-planetWidth/2-gap,centre+planetWidth/2+gap,centre+planetWidth/2+gap*2+widths[1]];
 const frames:Frame[]=[];
 const bounds:Bounds[]=[];
 for(let i=0;i<3;i++) {
  const box=boxes[i],first:Frame=[1,0,0,1,firstEdges[i]-(i===0?box.right:box.left),centreY-(box.top+box.bottom)/2];
  const edge=i===0 ? ring.left-X : i===1 ? ring.right+X : bounds[1].right+X;
  const frameAt=(theta:number)=>interpolate(first,inkFrame(glyphs[i],theta,config,view,perPixel),t);
  let m=first;
  if(t>0) {
   let lo=-1.45,hi=1.45;
   for(let n=0;n<40;n++) {
    const mid=(lo+hi)/2,b=transformedBounds(glyphs[i].points,frameAt(mid));
    if((i===0?b.right:b.left)<edge)lo=mid;else hi=mid;
   }
   m=frameAt((lo+hi)/2);
  }
  frames.push(m);bounds.push(transformedBounds(glyphs[i].points,m));
 }
 // Centre the complete painted S…L extent, without changing any of the three ink gaps.
 const offset=centre-(bounds[0].left+bounds[2].right)/2;
 for(const m of [...frames,O])m[4]+=offset;
 for(const b of [...bounds,ring]){b.left+=offset;b.right+=offset;}
 return {S:frames[0],O,U:frames[1],L:frames[2],ring,bounds,gap:X,planetWidth,planetHeight:height,planetScale,
  rules:{left:bounds[0].left-X,right:bounds[2].right+X}};
}
