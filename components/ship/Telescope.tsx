import {useId,useEffect,useRef} from 'react';
import './telescope.css';
import {project,type DomeConfig,type Vec3,type Viewport} from '@/lib/ship/domeGeometry';
import {telescopeStation} from '@/lib/ship/telescope';
import {PlantInteraction} from './PlantInteraction';
export function Telescope({config,view,onClick,engaged=false}:{config:DomeConfig;view:Viewport;onClick?:()=>void;engaged?:boolean}){
 const id=useId(),{base,eye,objective}=telescopeStation(config),mount={x:(eye.x+objective.x)/2,y:(eye.y+objective.y)/2,z:(eye.z+objective.z)/2},pivot={...base,y:base.y+1.5};
 const barrel=useRef<SVGGElement>(null);
 useEffect(()=>{
  const element=barrel.current;if(!element)return;
  if(!engaged){element.style.transform='rotate(0deg)';return;}
  // Let Charlie take hold before he adjusts the eyepiece to his eye.
  const timer=window.setTimeout(()=>{element.style.transform='rotate(-14deg)';},400);
  return()=>window.clearTimeout(timer);
 },[engaged]);
 // Safari and the server can differ at the last bit of trigonometric results.
 // Quantise projected values before deriving SVG attributes and path strings.
 const precise=(value:number)=>Math.round(value*10000)/10000;
 const p=(q:Vec3)=>{const projected=project(q,config,view);return {...projected,x:precise(projected.x),y:precise(projected.y),scale:precise(projected.scale)};},a=p(eye),b=p(objective),c=p(pivot),floor=p(base);
 const angle=precise(Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI),length=precise(Math.hypot(b.x-a.x,b.y-a.y)),s=a.scale;
 const line=(u:Vec3,v:Vec3)=>{const x=p(u),y=p(v);return `M${x.x} ${x.y}L${y.x} ${y.y}`;};
 return <svg width={view.width} height={view.height} style={{position:'absolute',inset:0,zIndex:7,pointerEvents:'none'}} aria-label="Vintage brass telescope on adjustable tripod">
 <defs><linearGradient id={id} x2="0" y2="1"><stop stopColor="#e0c18a"/><stop offset=".35" stopColor="#af8745"/><stop offset=".65" stopColor="#806132"/><stop offset="1" stopColor="#c4a16a"/></linearGradient></defs>
 <ellipse cx={floor.x} cy={floor.y} rx={s*.48} ry={s*.08} fill="#051019" opacity=".22"/>
 <PlantInteraction label="Look through telescope" tooltip="Telescope" onClick={onClick}>
 <rect x={Math.min(a.x,b.x,floor.x-s*.5)} y={Math.min(a.y,b.y)-s*.15} width={Math.max(a.x,b.x,floor.x+s*.5)-Math.min(a.x,b.x,floor.x-s*.5)} height={floor.y-Math.min(a.y,b.y)+s*.2} fill="transparent"/>
 {[-1,0,1].map((n,i)=>{const foot={x:base.x+n*.43,y:base.y,z:base.z+(i===1?-.4:.23)};return <g key={i}><path d={line(pivot,foot)} stroke="#493d2e" strokeWidth={s*.085} strokeLinecap="round"/><path d={line(pivot,foot)} stroke="#ae905d" strokeWidth={s*.05}/><path d={line({...foot,y:foot.y+.07},foot)} stroke="#352f28" strokeWidth={s*.09} strokeLinecap="round"/></g>;})}
 <path d={line(pivot,mount)} stroke="#c4a16a" strokeWidth={s*.075}/>
 <circle cx={c.x} cy={c.y} r={s*.075} fill="#806139" stroke="#d6b77e"/>
 <g ref={barrel} className="telescope-barrel" style={{transformOrigin:`${p(mount).x}px ${p(mount).y}px`}}>
 <g transform={`translate(${a.x} ${a.y}) rotate(${angle})`}>
 <rect x={-s*.08} y={-s*.06} width={length+s*.13} height={s*.12} rx={s*.03} fill="#3c3a32"/>
 <path d={`M${length*.1} ${-s*.065}L${length} ${-s*.16}V${s*.16}L${length*.1} ${s*.065}Z`} fill={`url(#${id})`} stroke="#5f482b" strokeWidth="1"/>
 {[.2,.66,.97].map(t=><rect key={t} x={length*t} y={-s*(.065+t*.1)} width={s*.045} height={s*(.13+t*.2)} rx="1" fill="#d0ac70" stroke="#6a502d" strokeWidth=".6"/>)}
 <ellipse cx={length+s*.04} cy="0" rx={s*.035} ry={s*.155} fill="#233c43" stroke="#c9ad79" strokeWidth="1.2"/>
 <path d={`M${length*.28} ${-s*.075}H${length*.6}`} stroke="#f1d39c" strokeOpacity=".5" strokeWidth="1.2"/>
 <circle cx={length*.5} cy={s*.16} r={s*.055} fill="#ad884c" stroke="#e0c18a"/>
 </g></g>
 </PlantInteraction></svg>;
}
