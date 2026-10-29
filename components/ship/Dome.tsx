import { memo, useId, useLayoutEffect, useRef } from 'react';
import { curvePath, domePoint, type DomeConfig, type Viewport } from '@/lib/ship/domeGeometry';
import styles from './ship.module.css';
import {domeIncidence,glassReflectance} from '@/lib/ship/domeOptics';

/** Reflection marks sampled on the existing sphere, never structural geometry. */
function reflection(config:DomeConfig,view:Viewport,theta:number,low:number,high:number,width:number) {
 const points=[];
 for(const side of [-1,1])for(let i=0;i<=32;i++) {
  const t=side===-1 ? i/32 : 1-i/32;
  const phi=low+(high-low)*t;
  const spread=width*Math.sin(Math.PI*t)**.65;
  const p=domePoint(theta+side*spread,phi,config,view);
  if(p.visible)points.push(`${p.x},${p.y}`);
 }
 return points.length ? `M${points.join(' L')} Z` : '';
}
// Nested, low-opacity contours feather in angular (surface) space. Unlike a
// screen blur, their width and curvature follow the camera projection. No timers,
// blur filters, duplicate glass surfaces or extra rendering passes are needed.
const reflections=[
 {theta:-1.48,low:.52,high:1.48,width:.055,halo:.17,strength:1},
 {theta:-1.34,low:.72,high:1.50,width:.014,halo:.07,strength:.55},
 {theta:1.56,low:.48,high:1.44,width:.035,halo:.15,strength:.9},
];
const feather=Array.from({length:16},(_,i)=>{
 const t=(i+.5)/16;
 return {t,weight:6*t*(1-t)/16};
});
export const Dome = memo(function Dome({ config, view, debug }: { config: DomeConfig; view: Viewport; debug: boolean }) {
 const id=useId(),glass=useRef<HTMLCanvasElement>(null);
 useLayoutEffect(()=>{
  const canvas=glass.current,context=canvas?.getContext('2d');if(!canvas||!context)return;
  // Only a smooth optical field is sampled here, never the sharp stars/content.
  // Repaint on camera/viewport changes, not on an animation clock.
  const width=Math.max(1,Math.ceil(view.width/4)),height=Math.max(1,Math.ceil(view.height/4));
  canvas.width=width;canvas.height=height;
  const image=context.createImageData(width,height),incidence=domeIncidence(config,view);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const cosine=incidence((x+.5)*view.width/width,(y+.5)*view.height/height);
   const i=(y*width+x)*4;
   // Suppress the constant head-on reflection to keep the shopfront clear;
   // retain the angle-dependent dielectric response with restrained tint.
   const alpha=cosine===null?0:Math.min(.14,.001+2.5*Math.max(0,glassReflectance(cosine)-.04));
   image.data[i]=140;image.data[i+1]=186;image.data[i+2]=181;image.data[i+3]=Math.round(alpha*255);
  }
  context.putImageData(image,0,0);
 },[config,view]);
 return <svg className={styles.dome} width={view.width} height={view.height} aria-hidden="true">
 <defs>
  <linearGradient id={`${id}-reflection`} x1="0" y1="0" x2="1" y2="1">
   <stop stopColor="#fff0cb" stopOpacity=".11" />
   <stop offset=".55" stopColor="#c6e7df" stopOpacity=".035" />
   <stop offset="1" stopColor="#a6d6df" stopOpacity="0" />
  </linearGradient>
 </defs>
 <foreignObject width={view.width} height={view.height}><canvas ref={glass} style={{width:"100%",height:"100%",display:"block"}} /></foreignObject>
 <g fill={`url(#${id}-reflection)`}>
  {reflections.flatMap((mark,index)=>feather.map(({t,weight},i)=><path
   key={`${index}-${i}`}
   opacity={weight*mark.strength}
   d={reflection(config,view,mark.theta,mark.low,mark.high,mark.width*.45+mark.halo*(1-t))}
  />))}
 </g>
 {debug && <g stroke="#a9dace" strokeOpacity=".18" strokeWidth="1" fill="none" strokeDasharray="3 7">{[.15, .3, .45, .6, .8, 1, 1.2, 1.4].map(phi => <path key={phi} d={curvePath(config, view, phi)} />)}{Array.from({ length: 24 }, (_, i) => <path key={i} d={curvePath(config, view, undefined, i * Math.PI / 12)} />)}</g>}
 </svg>;
});
