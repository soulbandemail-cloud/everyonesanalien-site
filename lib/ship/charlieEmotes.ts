export const EMOTES=[
 {id:'idea',label:'Idea',icon:'idea'}, {id:'wave',label:'Wave',icon:'wave'},
 {id:'peace',label:'Peace',icon:'peace'}, {id:'love',label:'Love',icon:'love'},
 {id:'kiss',label:'Kiss',icon:'kiss'}, {id:'dance-1',label:'Dance 1',icon:'shuffle'},
 {id:'dance-2',label:'Dance 2',icon:'disco'}, {id:'dance-3',label:'Dance 3',icon:'spin'},
 {id:'guitar',label:'Guitar',icon:'guitar'}, {id:'laugh',label:'Laugh',icon:'laugh'},
 {id:'confused',label:'Confused',icon:'confused'}, {id:'sleepy',label:'Sleepy',icon:'sleepy'},
] as const;
export type EmoteId=typeof EMOTES[number]['id'];
export type Point3=[number,number,number];
export type EmoteArm={hand:Point3;elbow:Point3;weight:number;peace:number;index:number;heart:number;open:number};
export type EmotePose={raise:number;sweep:number;lean:number;pitch:number;headTilt:number;headNod:number;bodyY:number;hipX:number;turn:number;stepL:number;stepR:number;liftL:number;liftR:number;droop:number;eyes:number;yawn:number;bulb:number;question:number;zzz:number;kiss:number;guitar:number;clock:number;arms:[EmoteArm,EmoteArm]};
export type EmoteCommand={kind:EmoteId|'recover';started:number;from:EmotePose};
export type EmoteControl={command:EmoteCommand|null};
const arm=(side:number):EmoteArm=>({hand:[side*13,side<0?162:160,side<0?-22:-25],elbow:[side*25,143,-3],weight:0,peace:0,index:0,heart:0,open:0});
export const neutralEmote:EmotePose={raise:0,sweep:0,lean:0,pitch:0,headTilt:0,headNod:0,bodyY:0,hipX:0,turn:0,stepL:0,stepR:0,liftL:0,liftR:0,droop:0,eyes:0,yawn:0,bulb:0,question:0,zzz:0,kiss:0,guitar:0,clock:0,arms:[arm(-1),arm(1)]};
export const EMOTE_DURATIONS:Record<EmoteId,number>={wave:2,peace:2.7,love:3,kiss:3.1,idea:2.6,confused:2.8,laugh:3,sleepy:3.8,'dance-1':2.4,'dance-2':2,'dance-3':3.2,guitar:2.4};
export const loopingEmote=(id:string)=>id.startsWith('dance-')||id==='guitar';
const ease=(t:number)=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
function blend(a:EmotePose,b:EmotePose,t:number):EmotePose{
 const result={...b};
 for(const key of Object.keys(b) as (keyof EmotePose)[])if(key!=='arms')result[key]=a[key]+(b[key]-a[key])*t;
 result.arms=b.arms.map((target,i)=>{const old=a.arms[i];return {...target,hand:target.hand.map((v,j)=>old.hand[j]+(v-old.hand[j])*t) as Point3,elbow:target.elbow.map((v,j)=>old.elbow[j]+(v-old.elbow[j])*t) as Point3,weight:old.weight+(target.weight-old.weight)*t,peace:old.peace+(target.peace-old.peace)*t,index:old.index+(target.index-old.index)*t,heart:old.heart+(target.heart-old.heart)*t,open:old.open+(target.open-old.open)*t};}) as EmotePose['arms'];
 return result;
}
export function guitarPoint(u:number,v:number,z=0):Point3{return [12+.65*u+.76*v,140-.76*u+.65*v,-34+z];}
export function emotePose(command:EmoteCommand|null,now:number,reduced=false):EmotePose{
 if(!command)return neutralEmote;
 const t=Math.max(0,(now-command.started)/1000);
 if(command.kind==='recover'){const from={...command.from,turn:((command.from.turn+180)%360+360)%360-180};return t>=.22?neutralEmote:blend(from,neutralEmote,ease(t/.22));}
 const id=command.kind,loop=loopingEmote(id),duration=EMOTE_DURATIONS[id];
 if(!loop&&t>=duration)return neutralEmote;
 const q=reduced?0:2*Math.PI*(t%duration)/duration,strength=reduced?.35:1;
 const p:EmotePose={...neutralEmote,arms:[arm(-1),arm(1)],raise:1,clock:t};
 const setArm=(side:number,hand:Point3,elbow:Point3,pose:Partial<EmoteArm>={})=>{p.arms[side<0?0:1]={...arm(side),weight:1,hand,elbow,...pose};};
 if(id==='wave'){
  const u=Math.max(0,Math.min(1,(t-.4)/1.1));p.sweep=-Math.cos(u*Math.PI*3);
  // Hold the left lean; the hand crosses its own raised arc, never the face.
  p.lean=(.18+.012*Math.sin(u*Math.PI*6))*strength;p.headTilt=.035;
  setArm(1,[55+p.sweep*24,-52,-12],[83,37,-7],{open:1});
  setArm(-1,[-20,162,-23],[-29,143,-5]);
 }else if(id==='peace'){
  for(const side of [-1,1])setArm(side,[side*78,-31,-12],[side*68,57,-6],{peace:1});
  p.bodyY=-4*Math.sin(Math.min(1,t/.7)*Math.PI/2)*strength;p.headNod=-.06;
 }else if(id==='love'){
  for(const side of [-1,1])setArm(side,[side*12,-53,-10],[side*78,25,-7],{heart:1});
  p.headTilt=.09;p.bodyY=-2*strength;
 }else if(id==='kiss'){
  const release=ease((t-.65)/.45);
  setArm(1,[9+release*61,60-release*7,-49-release*9],[55,102,-26],{open:release});
  p.headTilt=-.08;p.headNod=.04;p.kiss=t>.85?1:0;
 }else if(id==='idea'){
  setArm(1,[77,0,-12],[69,67,-6],{index:1});p.headNod=-.16;p.headTilt=-.06;p.bulb=1;
 }else if(id==='confused'){
  p.headTilt=.15*Math.sin(t*1.8);p.droop=1;p.question=1;p.hipX=2*Math.sin(t*2)*strength;
  setArm(-1,[-45,137,-21],[-31,139,-4],{open:1});
 }else if(id==='laugh'){
  const pulse=Math.max(0,Math.sin((t-.3)*Math.PI*3));p.bodyY=-4*pulse*strength;p.pitch=.13;p.eyes=.85;p.headNod=.08;p.lean=.025*Math.sin(t*6);
  setArm(-1,[-20,137,-22],[-36,133,-5]);setArm(1,[15,140,-25],[32,132,-6]);
 }else if(id==='sleepy'){
  const slump=ease((t-1.3)/.6)*(1-ease((t-2.7)/.3));p.bodyY=6*slump*strength;p.pitch=.1*slump;p.headNod=.2*slump;p.eyes=.7;p.yawn=1;p.droop=slump;p.zzz=slump;
  for(const side of [-1,1])setArm(side,[side*(74-45*slump),-15+166*slump,-12],[side*(66-35*slump),48+95*slump,-6],{open:1-slump});
 }else if(id==='dance-1'){
  p.hipX=6*Math.sin(q)*strength;p.lean=.055*Math.sin(q)*strength;p.headNod=.035*Math.sin(q*2);p.stepL=5*Math.sin(q)*strength;p.stepR=-p.stepL;p.liftL=2*Math.max(0,Math.sin(q))*strength;p.liftR=2*Math.max(0,-Math.sin(q))*strength;
  for(const side of [-1,1])setArm(side,[side*28+8*Math.sin(q),155,-21+side*7*Math.cos(q)],[side*30,134,-5]);
 }else if(id==='dance-2'){
  const a=(Math.sin(q)+1)/2;p.hipX=-7*Math.sin(q)*strength;p.bodyY=3*(1-Math.cos(q*2))*strength;p.lean=.09*Math.sin(q)*strength;
  for(const side of [-1,1]){const up=side===1?a:1-a;setArm(side,[side*(31+48*up),172-204*up,-15],[side*(32+40*up),143-97*up,-5],{index:1});}
 }else if(id==='dance-3'){
  const hop=Math.max(0,Math.sin(q*4))*5*strength;p.bodyY=-hop;p.liftL=hop;p.liftR=hop;p.stepL=7*Math.sin(q*2)*strength;p.stepR=p.stepL;p.hipX=p.stepL;p.lean=.1*Math.sin(q*2)*strength;
  // One turn per loop is geometrically continuous at the boundary.
  p.turn=reduced?0:360*ease(((t%duration)/duration-.55)/.35);
  for(const side of [-1,1])setArm(side,[side*(55+15*Math.sin(q*2)),103+30*Math.cos(q*2+side),-17],[side*43,115,-6],{open:1});
 }else if(id==='guitar'){
  p.guitar=1;p.lean=.09*Math.sin(q)*strength;p.pitch=.06;p.bodyY=3*(1-Math.cos(q*2))*strength;
  setArm(-1,guitarPoint(0,-43+8*Math.sin(q),-6),[-40,112,-23]);
  setArm(1,guitarPoint(8*Math.sin(q*8),20,-7),[43,132,-20]);
 }
 const attack=id==='wave'?.4:.35,release=id==='wave'?.5:.45;
 // Both the body and arms share the same envelope on entry and exit.
 let result=t<attack?blend(command.from,p,ease(t/attack)):p;
 if(!loop&&t>duration-release)result=blend(result,neutralEmote,ease((t-duration+release)/release));
 return result;
}
export function canEmote(state:{mode:string;phase:unknown;engagement:unknown;moving:number},scripted:boolean){return state.mode==='standing'&&!state.phase&&!state.engagement&&state.moving<.02&&!scripted;}
/** Uniform clock spacing; reserve touch-sized targets before clamping the centre. */
export function emoteWheelLayout(x:number,y:number,width:number,height:number,scale=1){
 const button= Math.max(32,38/Math.max(.1,scale)),margin=button/2+4;
 const minimum=(button+3)/(2*Math.sin(Math.PI/12));
 const preferred=Math.max(minimum,100/Math.max(.1,scale));
 const room=Math.min(x-margin,width-x-margin,y-margin,height-y-margin);
 const radius=Math.min(preferred,Math.max(minimum,room),Math.max(0,Math.min(width,height)/2-margin));
 return {x:Math.max(radius+margin,Math.min(width-radius-margin,x)),y:Math.max(radius+margin,Math.min(height-radius-margin,y)),radius,button};
}
