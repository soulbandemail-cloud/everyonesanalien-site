import { useId, type ReactNode } from 'react';
import { project, type DomeConfig, type Viewport, type Vec3 } from '@/lib/ship/domeGeometry';
import { COMMAND_DECK, commandWall } from '@/lib/ship/commandDeck';

type Instrument = 'vu'|'gauge'|'patch'|'navigation'|'switches'|'compressor';
const brass='#b49a70', ink='#172823', cream='#e6cc91';
function Knob({x,y,r=4}:{x:number;y:number;r?:number}) {return <g><circle cx={x} cy={y+1} r={r+1} fill="#101c19"/><circle cx={x} cy={y} r={r} fill="#565d4d" stroke={brass} strokeWidth=".8"/><path d={`M${x} ${y}v${-r+1}`} stroke={cream} strokeWidth="1"/></g>;}
function Meter({x=9,y=7}:{x?:number;y?:number}) {return <g transform={`translate(${x} ${y})`}><rect width="32" height="18" rx="2" fill="#342e22" stroke={brass}/><rect x="3" y="3" width="26" height="12" rx="1" fill={cream}/><path d="M6 12Q16 0 26 12" fill="none" stroke="#675a42"/><path d="M16 14L23 5" stroke="#8e422d"/><path d="M8 8v3m5-5v3m6-3v3m5-1v3" stroke="#6d6547" strokeWidth=".7"/></g>;}
function Module({kind,label}:{kind:Instrument;label:string}) {return <g>
 <rect x="1" y="2" width="98" height="47" rx="2" fill="#111e1c"/>
 <rect x="1" width="98" height="46" rx="1" fill={kind==='vu'||kind==='gauge'?'#726550':'#35483e'} stroke="#b09873" strokeWidth="1.6"/>
 <path d="M3 44V2H97" fill="none" stroke="#d4bd90" strokeOpacity=".35"/>
 {[4,96].flatMap(x=>[4,42].map(y=><g key={`${x}-${y}`}><circle cx={x} cy={y} r="1.5" fill="#172b26"/><path d={`M${x-1} ${y}h2`} stroke="#927f5f" strokeWidth=".5"/></g>))}
 <text x="8" y="41" fontSize="5" fontFamily="monospace" letterSpacing="1" fill="#c4b48e">{label}</text>
 {kind==='vu' && <><Meter/><Meter x={46}/><Knob x={88} y={17}/><circle cx="87" cy="30" r="2" fill="#e2aa52"/></>}
 {kind==='gauge' && <><circle cx="27" cy="21" r="17" fill={ink} stroke={brass} strokeWidth="2"/><circle cx="27" cy="21" r="13" fill={cream}/><path d="M16 22A11 11 0 0 1 38 22M18 13l2 3m7-6v4m8 0l-2 3" fill="none" stroke="#5c634f"/><path d="M27 22l8-9" stroke="#824b35" strokeWidth="1.5"/><Knob x={ sixty } y={18} r={8}/><Knob x={83} y={24} r={5}/></>}
 {kind==='patch' && <>{Array.from({length:12},(_,i)=><circle key={i} cx={12+i%6*14} cy={10+Math.floor(i/6)*14} r="3" fill="#111e19" stroke="#9c9879" strokeWidth="1.2"/>)}<path d="M26 10C18 52 72 51 68 24" fill="none" stroke="#b18547" strokeWidth="2.3"/><path d="M54 10C57 40 91 40 82 24" fill="none" stroke="#7a5340" strokeWidth="2.3"/></>}
 {kind==='navigation' && <><rect x="8" y="6" width="49" height="28" rx="3" fill="#0e2723" stroke="#75876c"/><path d="M13 20h39M32 9v22M16 28l10-14 10 10 12-9" fill="none" stroke="#70a891" strokeWidth=".9"/><ellipse cx="32" cy="20" rx="14" ry="9" fill="none" stroke="#507968"/><circle cx="37" cy="17" r="2" fill="#b1ddad"/><Knob x={72} y={16} r={7}/>{[0,1,2].map(i=><rect key={i} x={64+i*9} y="29" width="5" height="3" fill={i===2?'#bd6942':'#d8b970'}/>)}</>}
 {kind==='switches' && <>{[0,1,2,3,4].map(i=><g key={i}><circle cx={14+i*17} cy="11" r="2" fill={i===3?'#a15d41':'#dfb66a'}/><rect x={11+i*17} y="17" width="6" height="14" rx="2" fill={ink}/><path d={`M${14+i*17} 26l${i%2?2:-2} -8`} stroke="#d3c9aa" strokeWidth="2.3"/></g>)}</>}
 {kind==='compressor' && <><Meter/><Knob x={56} y={18} r={8}/><Knob x={79} y={18} r={8}/><path d="M47 31h41m-41 3h41" stroke="#101f1d" strokeWidth="1.5"/></>}
 </g>;}
const sixty=60;

export function ConsoleDetails({config,view}:{config:DomeConfig;view:Viewport}) {
 const lightId=useId();
 // Artwork coordinates are projected onto the existing world-space surfaces.
 const art=(key:string,p:Vec3,width:number,height:number,children:ReactNode)=>{
  const a=project(p,config,view),b=project({...p,x:p.x+width},config,view),c=project({...p,y:p.y-height},config,view);
  return <g key={key} transform={`matrix(${(b.x-a.x)/100} ${(b.y-a.y)/100} ${(c.x-a.x)/50} ${(c.y-a.y)/50} ${a.x} ${a.y})`}>{children}</g>;
 };
 const bank=(x:number,y:number)=>{const p=commandWall(x,y,config);return {...p,z:p.z-COMMAND_DECK.bankDepth-.006};};
 const face=(x:number,y:number)=>({x,y,z:COMMAND_DECK.deskFrontZ+.16*(x/COMMAND_DECK.halfWidth)**2-.006});
 const modules:Array<[number,number,Instrument,string]>=[[-2.73,.84,'gauge','CABIN PRESSURE'],[-1.84,.87,'vu','ENGINE BUS'],[-.92,.84,'switches','THRUST'],[.08,.85,'navigation','ORBIT'],[1.04,.85,'compressor','COMMS'],[1.99,.85,'patch','SIGNAL ROUTING']];
 // Equal margins, widths and gaps on both rows; all modules stay inside the fascia.
 const rackWidth=.79, rackGap=.14, rackLeft=-(6*rackWidth+5*rackGap)/2;
 const racks:Array<[Instrument,string]>=[['vu','AUX POWER'],['patch','PATCH BAY'],['switches','LIFE SUPPORT'],['navigation','NAV VECTOR'],['vu','TRANSMISSION'],['compressor','AIR LOCK'],['compressor','LIMITER'],['switches','FUEL MIX'],['navigation','BEACON'],['patch','RETURN'],['gauge','OXYGEN'],['switches','RESERVE']];
 // Horizontal artwork follows the existing desktop plane, rather than facing the camera.
 const desktop=(key:string,x:number,z:number,width:number,depth:number,children:ReactNode)=>{
  const y=COMMAND_DECK.deskY+.012;
  const a=project({x,y,z},config,view),b=project({x:x+width,y,z},config,view),c=project({x,y,z:z-depth},config,view);
  return <g key={key} transform={`matrix(${(b.x-a.x)/100} ${(b.y-a.y)/100} ${(c.x-a.x)/50} ${(c.y-a.y)/50} ${a.x} ${a.y})`}>{children}</g>;
 };
 const prop=(key:string,x:number,width:number,height:number,children:ReactNode)=>{
  const p=commandWall(x,COMMAND_DECK.panelTop+height,config);p.z-=.26;
  return art(key,p,width,height,children);
 };
 return <g aria-label="Analogue spacecraft instrumentation and console ornaments" pointerEvents="none">
  <defs><radialGradient id={`${lightId}-warm`}><stop stopColor="#ffc477" stopOpacity=".28"/><stop offset=".4" stopColor="#efac57" stopOpacity=".12"/><stop offset="1" stopColor="#efac57" stopOpacity="0"/></radialGradient></defs>
  {modules.map(([x,y,kind,label],i)=>art(`bank-${i}`,bank(x,y),.79,.3,<Module kind={kind} label={label}/>))}
  {racks.map(([kind,label],i)=>art(`rack-${i}`,face(rackLeft+(i%6)*(rackWidth+rackGap),.36-Math.floor(i/6)*.35),rackWidth,.26,<Module kind={kind} label={label}/>))}
  {desktop('master-command',-1.9,7.88,.32,.26,<><rect width="100" height="50" rx="6" fill={ink} stroke={brass} strokeWidth="3"/><ellipse cx="50" cy="27" rx="25" ry="20" fill="#32251e" stroke={brass} strokeWidth="4"/><ellipse cx="50" cy="22" rx="21" ry="17" fill="#b7372e" stroke="#dc7660" strokeWidth="2"/><path d="M38 13Q48 6 61 13" fill="none" stroke="#ef9c80" strokeWidth="2"/></>)}
  {desktop('guarded-ignition',.88,7.86,.65,.25,<><rect width="100" height="50" rx="3" fill={ink} stroke={brass} strokeWidth="2"/>{[18,50,82].map((x,i)=><g key={x}><rect x={x-10} y="9" width="20" height="31" rx="3" fill="#28372f" stroke="#9c815a" strokeWidth="2"/><path d={`M${x-10} 27V5H${x+10}V27`} fill="none" stroke="#b06b46" strokeWidth="4"/><path d={`M${x} 32l${i===1?3:-3} -15`} stroke="#d7d0b3" strokeWidth="3"/><circle cx={x} cy="43" r="2" fill="#e2b46c"/></g>)}</>)}
  {desktop('flight-commands',1.85,7.87,.64,.24,<><rect width="100" height="50" rx="3" fill={ink} stroke={brass} strokeWidth="2"/>{[0,1,2,3].map(i=><g key={i}><rect x={8+i*23} y="9" width="15" height="19" rx="2" fill={i===3?'#bd9253':'#5b8675'} stroke="#b0b399" strokeWidth="1.5"/><path d={`M${12+i*23} 19h7`} stroke="#d5d9b7"/><circle cx={15+i*23} cy="38" r="3" fill={i%2?'#c4a161':'#8ab99b'}/></g>)}</>)}
  {[-2.65,-1.75,1.1,2.1].map((x,i)=>art(`meter-light-${i}`,face(x,.38),.6,.3,<ellipse cx="50" cy="25" rx="50" ry="25" fill={`url(#${lightId}-warm)`}/>))}
  {prop('reel',-1.35,.85,.43,<><rect x="1" y="3" width="98" height="46" rx="2" fill="#76664e" stroke="#b49a70" strokeWidth="2"/>{[27,73].map(x=><g key={x}><circle cx={x} cy="22" r="18" fill="#aa9a7c" stroke="#352f26" strokeWidth="2"/>{[0,120,240].map(a=><ellipse key={a} cx={x} cy="12" rx="4" ry="6" fill="#24302a" transform={`rotate(${a} ${x} 22)`}/>)}<circle cx={x} cy="22" r="3" fill="#332c21"/></g>)}<path d="M27 40H73" stroke="#261f1a" strokeWidth="2"/><circle cx="49" cy="43" r="2" fill="#d8b067"/></>)}
  {prop('lamp',-2.07,.62,.87,<><ellipse cx="39" cy="48" rx="22" ry="2" fill="#9d8252"/><path d="M39 47L31 24 64 10" fill="none" stroke="#a98c56" strokeWidth="4"/><circle cx="31" cy="24" r="3" fill="#d2ad67"/><path d="M43 14Q52 -2 76 4L94 17Z" fill="#526048" stroke="#b49a70" strokeWidth="1.5"/><path d="M44 15L93 18" stroke="#ffe1a0" strokeWidth="3"/><ellipse cx="68" cy="20" rx="23" ry="4" fill="#ffcb74" opacity=".1"/></>)}
  {prop('lava',2.48,.24,.74,<><path d="M25 49L33 38 22 13 36 2H64L78 13 67 38 75 49Z" fill="#8c7653" stroke="#bfa379"/><path d="M29 14L38 37H63L72 14 62 7H39Z" fill="#61382e" stroke="#d7ac6c"/><path d="M40 34C26 25 58 27 45 17S70 13 59 24 76 34 40 34" fill="#edaa53"/><path d="M34 13l7 20" stroke="#ffddb0" opacity=".35"/></>)}
  {[-2.82].map((x,i)=>prop(`plant-${i}`,x,.38,.57,<><path d="M20 34H81L71 49H30Z" fill={i?'#85704c':'#9b7750'} stroke="#c0a071"/><path d="M50 35V12M50 28L23 14M50 23L78 9" fill="none" stroke="#75834b" strokeWidth="3"/>{[[24,17,-35],[74,13,40],[46,10,-10],[69,26,60],[29,28,-55]].map(([cx,cy,a],j)=><ellipse key={j} cx={cx} cy={cy} rx="9" ry="4" transform={`rotate(${a} ${cx} ${cy})`} fill={j%2?'#7d8951':'#4d693e'} stroke="#a0a064" strokeWidth=".6"/>)}</>))}
 </g>;
}
