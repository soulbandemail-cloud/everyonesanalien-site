'use client';
import {useEffect,useRef,useState,useCallback,useId,type MutableRefObject,type PointerEvent} from 'react';
import DomeWishes from '../home/DomeWishes';
import RealPlanetHeart from '../home/RealPlanetHeart';
import {PLANET_INK} from '@/lib/ship/wordmarkGeometry';
import {paintSky,skyStars} from '@/lib/ship/starfield';
import {telescopeDrag,telescopeLimit,TELESCOPE_TAP_THRESHOLD,type TelescopeDirection} from '@/lib/ship/telescope';
import './telescope.css';

// Batch the existing stars into vector paths so magnification stays crisp without
// thousands of SVG nodes or a large mobile canvas.
const starDepths=Array.from({length:7},(_,depth)=>({focus:depth*100/6,layers:Array.from({length:15},(_,i)=>({colour:['#b8cce9','#e1e4ec','#e0c6a8'][Math.floor(i/5)],alpha:(i%5+1)/5,path:''}))}));
for(const star of skyStars()){
 const tone=star.tone<.08?0:star.tone>.94?2:1;
 // Stable fictional depth, independent of position and the current focus setting.
 const depth=Math.floor((Math.sin(star.x*12.9898+star.y*78.233)*43758.5453%1+1)%1*7);
 const layer=starDepths[depth].layers[tone*5+Math.min(4,Math.floor(star.alpha*5))];
 const {x,y,radius:r}=star;
 layer.path+=`M${x-r},${y}a${r},${r} 0 1,0 ${r*2},0a${r},${r} 0 1,0 ${-r*2},0`;
 if(star.spike)layer.path+=`M${x-.3},${y-4}h.6v8h-.6zM${x-4},${y-.3}h8v.6h-8z`;
}
export function TelescopeView({directionRef,onClose}:{directionRef:MutableRefObject<TelescopeDirection>;onClose:()=>void}){
 const root=useRef<HTMLDivElement>(null),sky=useRef<HTMLCanvasElement>(null),frame=useRef(0),near=useRef<SVGSVGElement>(null);
 const drag=useRef<{id:number;x:number;y:number;lastX:number;lastY:number;moved:boolean}|null>(null);
 const target=useRef({x:0,y:0}),display=useRef({x:0,y:0}),raw=useRef({x:0,y:0});
 const [closing,setClosing]=useState(false);
 const [focus,setFocus]=useState(50);
 // Fixed sky coordinates beside the existing cross star at (1133,352).
 // 116 sky units render as ~274px across at a 1480×930 viewport.
 const planetWidth=116,planetHeight=116*(PLANET_INK.bottom-PLANET_INK.top)/(PLANET_INK.right-PLANET_INK.left);
 const planetFocusId=`telescope-planet-focus-${useId().replace(/:/g,'')}`;
 const planetBlur=Math.min(7,Math.max(0,Math.abs(focus-18)-4)*.16);

 const leave=useCallback(()=>setClosing(true),[]);
 useEffect(()=>{if(!closing)return;const timer=window.setTimeout(onClose,200);return()=>window.clearTimeout(timer);},[closing,onClose]);
 useEffect(()=>{
  target.current={...directionRef.current};display.current={...directionRef.current};
  raw.current={x:24*Math.atanh(directionRef.current.x/24),y:18*Math.atanh(directionRef.current.y/18)};
  if(sky.current)paintSky(sky.current,1,'all');
  const paint=()=>{if(sky.current)sky.current.style.transform=`translate(${-display.current.x*.65}%,${display.current.y*.65}%) scale(2.8)`;if(near.current){const w=1800/2.8,h=1100/2.8;near.current.setAttribute('viewBox',`${(1800-w)*.43+display.current.x*.0072*w} ${(1100-h)*.45-display.current.y*.0072*h} ${w} ${h}`);}};
  paint();
  let last=performance.now();
  const tick=(now:number)=>{
   const blend=1-Math.exp(-Math.min(.05,(now-last)/1000)*18);last=now;
   display.current.x+=(target.current.x-display.current.x)*blend;
   display.current.y+=(target.current.y-display.current.y)*blend;
   directionRef.current={...display.current};paint();
   if(drag.current)frame.current=requestAnimationFrame(tick);else frame.current=0;
  };
  const start=()=>{if(!frame.current){last=performance.now();frame.current=requestAnimationFrame(tick);}};
  const element=root.current!;element.addEventListener('pointerdown',start);
  const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')leave();};window.addEventListener('keydown',escape);
  element.focus();
  return()=>{cancelAnimationFrame(frame.current);frame.current=0;element.removeEventListener('pointerdown',start);window.removeEventListener('keydown',escape);};
 },[directionRef,leave]);
 const down=(e:PointerEvent<HTMLDivElement>)=>{
  if((e.target as Element).closest('button,input,form,.wish-rules-box,.wish-pong-handle')||!e.isPrimary||e.button!==0)return;
  drag.current={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};
 };
 const move=(e:PointerEvent<HTMLDivElement>)=>{
  const d=drag.current;if(!d||d.id!==e.pointerId)return;
  if(!d.moved&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<TELESCOPE_TAP_THRESHOLD)return;
  d.moved=true;e.currentTarget.setPointerCapture(e.pointerId);
  const frame=e.currentTarget.closest<HTMLElement>('[data-cockpit-presentation]');
  const delta=telescopeDrag(e.clientX-d.lastX,e.clientY-d.lastY,Number(frame?.dataset.presentationAngle??0),Number(frame?.dataset.presentationScale??1));
  d.lastX=e.clientX;d.lastY=e.clientY;
  raw.current.x-=delta.x*.08;raw.current.y+=delta.y*.08;
  raw.current.x=Math.max(-65,Math.min(65,raw.current.x));raw.current.y=Math.max(-48,Math.min(48,raw.current.y));
  target.current={x:telescopeLimit(raw.current.x,24),y:telescopeLimit(raw.current.y,18)};
 };
 const release=(e:PointerEvent<HTMLDivElement>)=>{
  if(drag.current?.id!==e.pointerId)return;
  drag.current=null;target.current={...display.current};directionRef.current={...display.current};
  raw.current={x:24*Math.atanh(display.current.x/24),y:18*Math.atanh(display.current.y/18)};
  if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
 };
 return <div ref={root} className="telescope-view" data-closing={closing||undefined} role="dialog" aria-modal="true" aria-label="Telescope — drag to explore; tap a shooting star to make a wish" tabIndex={-1} onPointerDown={down} onPointerMove={move} onPointerUpCapture={release} onPointerCancel={release}>
  <canvas ref={sky} className="telescope-sky" aria-hidden="true"/>
  <svg ref={near} className="telescope-near" viewBox="0 0 1800 1100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">{starDepths.map((depth,index)=>{
   const distance=Math.max(0,Math.abs(focus-depth.focus)-8.34);
   const blur=Math.min(4.6,distance*.11);
   // Broaden defocused points as well as blurring them: their scattered light
   // veils other depths instead of simply disappearing into the navy backdrop.
   return <g key={index} data-focus-depth={depth.focus} style={{filter:blur?`blur(${blur}px)`:undefined}}>
    {depth.layers.map((layer,i)=><path key={i} d={layer.path} fill={layer.colour} stroke={blur?layer.colour:'none'} strokeWidth={blur*.9} opacity={Math.min(1,layer.alpha*(blur? .65:1.65))}/>)}
   </g>;
  })}
   <defs>
    <filter id={planetFocusId} x="-70%" y="-100%" width="240%" height="300%" colorInterpolationFilters="sRGB">
     <feGaussianBlur stdDeviation={planetBlur}/>
    </filter>
   </defs>
   {/* Keep defocus in sky coordinates. Filtering the HTML inside foreignObject
       creates a separate Safari compositing layer that can lose the sky transform. */}
   <g filter={`url(#${planetFocusId})`}>
   <foreignObject x={1035-29-40} y={410-planetHeight/4-40} width={planetWidth+80} height={planetHeight+80} pointerEvents="none" className="telescope-planet" data-focus-depth="18">
    <div style={{padding:40,width:planetWidth+80,height:planetHeight+80,boxSizing:'border-box'}}>
     <div style={{width:planetWidth,height:planetHeight}}><RealPlanetHeart/></div>
    </div>
   </foreignObject>
   </g>
  </svg>
  <div className="telescope-optics" aria-hidden="true"/>
  <div className="telescope-wishes"><DomeWishes tapToCatch/></div>
  <label className="telescope-focus">Focus<input aria-label="Telescope focus" type="range" min="0" max="100" value={focus} onChange={e=>setFocus(Number(e.target.value))}/></label>
  <button className="telescope-back" onClick={leave}>Back</button>
 </div>;
}
