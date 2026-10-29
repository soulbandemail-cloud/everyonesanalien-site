import {useEffect,useId,useRef} from 'react';
import {project,type DomeConfig,type Viewport} from '@/lib/ship/domeGeometry';
import {platformY} from '@/lib/ship/roomGeometry';
import {HALLOWEEN} from '@/lib/ship/seasonal';
import {useSeasonalDecoration} from './useSeasonalDecoration';
import {PlantInteraction} from './PlantInteraction';

export function SeasonalPumpkin({config,view,active}:{config:DomeConfig;view:Viewport;active:boolean}){
 const {visible,lit,toggle}=useSeasonalDecoration(HALLOWEEN);
 return visible?<Pumpkin config={config} view={view} active={active} lit={lit} toggle={toggle}/>:null;
}
function Pumpkin({config,view,active,lit,toggle}:{config:DomeConfig;view:Viewport;active:boolean;lit:boolean;toggle:()=>void}){
 const id=useId(),light=useRef<SVGGElement>(null);
 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>|undefined;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const stop=()=>clearTimeout(timer);
  const tick=()=>{if(light.current)light.current.style.opacity=String(.76+Math.random()*.24);timer=setTimeout(tick,110+Math.random()*240);};
  const resume=()=>{stop();if(light.current)light.current.style.opacity='1';if(lit&&active&&!document.hidden&&!reduced.matches)tick();};
  resume();document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);
  return()=>{stop();document.removeEventListener('visibilitychange',resume);reduced.removeEventListener('change',resume);};
 },[lit,active]);
 // A stationary prop on the existing platform, just inward of the old mousehole.
 const p=project({x:config.centre.x+4.1,y:platformY,z:config.centre.z+7.65},config,view),scale=p.scale*.009;
 const face='M-31 -48L-19 -72L-7 -50Z M9 -50L23 -71L35 -46Z M-7 -33L3 -48L12 -31Z M-38 -38Q-30 -29 -20 -25L-20 -18L-12 -15L-12 -22Q1 -18 13 -22L14 -15L22 -18L22 -25Q33 -30 40 -40Q34 -6 9 -3L8 -11L-3 -11L-4 -3Q-34 -6 -38 -38Z';
 return <svg width={view.width} height={view.height} style={{position:'absolute',inset:0,zIndex:7,pointerEvents:'none'}} aria-label="Seasonal Halloween pumpkin">
  <defs>
   <radialGradient id={`${id}-skin`} cx=".35" cy=".23" r=".8"><stop stopColor="#c88135"/><stop offset=".48" stopColor="#ab5925"/><stop offset="1" stopColor="#63371e"/></radialGradient>
   <radialGradient id={`${id}-candle`} cx=".48" cy=".65"><stop stopColor="#fff3a3"/><stop offset=".6" stopColor="#ffd45e"/><stop offset="1" stopColor="#e88c24"/></radialGradient>
   <radialGradient id={`${id}-pool`}><stop stopColor="#f9b34c" stopOpacity=".16"/><stop offset="1" stopColor="#f9b34c" stopOpacity="0"/></radialGradient>
   <clipPath id={`${id}-carvings`}><path d={face}/></clipPath>
  </defs>
  <g transform={`translate(${p.x} ${p.y}) scale(${scale})`}>
   <ellipse cy="-1" rx="47" ry="9" fill="#101719" opacity=".3" pointerEvents="none"/>
   <PlantInteraction label="Toggle pumpkin light" tooltip={lit?'Turn Off':'Turn On'} selected={lit} onClick={active?toggle:undefined} resetHoverOnClick>
    <path d="M-7 -87Q-13 -100 -8 -109L0 -112Q-4 -99 5 -88Z" fill="#4e4b2b" stroke="#333326" strokeWidth="2"/>
    <path d="M0 -87C-23 -96 -47 -83 -50 -56C-59 -26 -40 -3 -21 -2Q0 4 24 -2C46 -7 58 -30 50 -57C46 -83 23 -95 0 -87Z" fill={`url(#${id}-skin)`} stroke="#57351f" strokeWidth="1.4"/>
    <g fill="none" strokeLinecap="round">
     <path d="M-9 -85C-31 -73 -39 -24 -22 -5M11 -85C31 -68 38 -22 25 -5M-32 -79C-48 -52 -47 -29 -37 -15M34 -78C49 -50 45 -28 39 -19" stroke="#6f3e21" strokeOpacity=".55" strokeWidth="2"/>
     <path d="M-3 -84Q-13 -46 -5 -8M7 -83Q20 -49 13 -8" stroke="#e39a46" strokeOpacity=".23" strokeWidth="2"/>
    </g>
    {/* The face opens onto a dark cavity with a thick carved skin bevel. */}
    <path d={face} fill="#23180f" stroke="#703915" strokeWidth="3.6" strokeLinejoin="round"/>
    <g clipPath={`url(#${id}-carvings)`}>
     <path d={face} transform="translate(1.8 2.5)" fill="#100e0c"/>
     {lit&&<g ref={light} style={{transition:'opacity 180ms linear'}}>
      <path d={face} transform="translate(1.8 2.5)" fill={`url(#${id}-candle)`}/>
     </g>}
    </g>
    <path d={face} fill="none" stroke={lit?'#d68b32':'#945421'} strokeWidth=".85" strokeLinejoin="round"/>
   </PlantInteraction>
   {lit&&<ellipse cy="2" rx="57" ry="12" fill={`url(#${id}-pool)`} pointerEvents="none"/>}
  </g>
 </svg>;
}
