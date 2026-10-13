import type {Outfit} from './clothing';
import type {AmbientPose} from './charlieAmbient';
/** Small illustrated meshes in the pilot's existing 180 × 250 drawing space. */
type V = {x:number;y:number;z:number};
type Face = {uv?:{x:number;y:number}[];points:V[];colour:string;eye?:boolean;head?:boolean;leg?:boolean;arm?:boolean;antenna?:boolean;side?:number};
const faces:Face[]=[];
const sphere=(centre:V,r:V,colour:string,rows=12,cols=24,output:Face[]=faces)=>{
 const point=(a:number,b:number)=>({x:centre.x+r.x*Math.sin(a)*Math.cos(b),y:centre.y+r.y*Math.cos(a),z:centre.z+r.z*Math.sin(a)*Math.sin(b)});
 for(let i=0;i<rows;i++)for(let j=0;j<cols;j++) output.push({colour,points:[point(i*Math.PI/rows,j*2*Math.PI/cols),point((i+1)*Math.PI/rows,j*2*Math.PI/cols),point((i+1)*Math.PI/rows,(j+1)*2*Math.PI/cols),point(i*Math.PI/rows,(j+1)*2*Math.PI/cols)]});
};
// Rounded head has substantial front/back depth even at a quarter turn.
sphere({x:0,y:85,z:0},{x:56,y:56,z:43},'#79cfb2',20,40);
faces.forEach(face=>{face.head=true;});
sphere({x:0,y:171,z:2},{x:15,y:39,z:11},'#79cfb2');
const tube=(points:V[],radius:number,colour:string,output:Face[]=faces)=>{
 for(let i=0;i<points.length-1;i++){
  const a=points[i],b=points[i+1];
  const length=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z);
  const axis={x:(b.x-a.x)/length,y:(b.y-a.y)/length,z:(b.z-a.z)/length};
  const n=Math.hypot(axis.x,axis.y)||1;
  const u={x:axis.y/n,y:-axis.x/n,z:0};
  const v={x:-axis.z*u.y,y:axis.z*u.x,z:axis.x*u.y-axis.y*u.x};
  const ring=(p:V,t:number)=>({x:p.x+radius*(u.x*Math.cos(t)+v.x*Math.sin(t)),y:p.y+radius*(u.y*Math.cos(t)+v.y*Math.sin(t)),z:p.z+radius*v.z*Math.sin(t)});
  for(let j=0;j<10;j++){const t=j*Math.PI/5,q=(j+1)*Math.PI/5;output.push({colour,points:[ring(a,t),ring(b,t),ring(b,q),ring(a,q)]});}
  sphere(a,{x:radius,y:radius,z:radius},colour,6,10,output);
  sphere(b,{x:radius,y:radius,z:radius},colour,6,10,output);
 }
};
// A short neck lifts the unchanged head clear of the chair back.
sphere({x:0,y:133,z:0},{x:6,y:13,z:6},'#79cfb2');
for(const side of [-1,1]){
 // Small shoulder bridges join the raised arms to the narrow upper torso.
 tube([{x:side*5,y:136,z:1},{x:side*9,y:136,z:.5},{x:side*12,y:138,z:0}],3.2,'#79cfb2');
 const armStart=faces.length;
 // Dropped shoulders, elbows beside the waist, forearms returning to the lap.
 const handY=side<0?198:196,handZ=side<0?-22:-25;
 tube([{x:side*12,y:138,z:0},{x:side*19,y:154,z:1},{x:side*25,y:181,z:-3},{x:side*22,y:191,z:-12},{x:side*13,y:handY,z:handZ}],2.8,'#79cfb2');
 sphere({x:side*13,y:handY+2,z:handZ},{x:4,y:5,z:3},'#79cfb2');
 for(let i=armStart;i<faces.length;i++){faces[i].arm=true;faces[i].side=side;}
 // Seated thighs extend forward from the planted hips before shins drop.
 const legStart=faces.length;
 const kneeZ=side<0?-43:-40;
 tube([{x:side*10,y:202,z:2},{x:side*15,y:203,z:-21},{x:side*18,y:206,z:kneeZ},{x:side*19,y:223,z:kneeZ+1},{x:side*20,y:244,z:kneeZ+5}],3,'#79cfb2');
 sphere({x:side*20,y:245,z:kneeZ},{x:6,y:3,z:8},'#79cfb2');
 for(let i=legStart;i<faces.length;i++){faces[i].leg=true;faces[i].side=side;}
 const headStart=faces.length;
 tube([{x:side*28,y:38,z:0},{x:side*35,y:24,z:0},{x:side*43,y:15,z:2}],1.8,'#7fffd4');
 sphere({x:side*43,y:15,z:2},{x:4.5,y:4.5,z:4.5},'#b6ffe5');
 for(let i=headStart;i<faces.length;i++){faces[i].antenna=true;faces[i].side=side;}
 // Eyes are surface patches on the FRONT hemisphere, never rear-facing decals.
 const eye=(r:number,t:number)=>{
  // Rounded teardrops with downward, slightly inward points.
  const u=Math.cos(t)*r,v=Math.sin(t)*r;
  // Fuller vertical lobes, especially near the nose, retaining the inner point.
  // Broaden only the lower arc into a flatter curve; preserve the upper arc.
  const contourV=v>0 ? v*(1+.18*(1-v)) : v;
  const eyeHeight=15.4*contourV*Math.sqrt(Math.max(0,(1+u)/2))*(1+.25*(1-u)/2);
  // Ten percent larger, with an intact central gap and inset outer edges.
  // Face-on viewer: his right eye points to 4 o’clock, his left to 8 o’clock.
  const angle=30*Math.PI/180;
  const x=side*(26+18.7*u*Math.cos(angle)+eyeHeight*Math.sin(angle));
  const y=94-18.7*u*Math.sin(angle)+eyeHeight*Math.cos(angle);
  return {x,y,z:-43*Math.sqrt(Math.max(0,1-(x/56)**2-((y-85)/56)**2))-2};
 };
 // Small surface-following cells avoid the old flat triangle fan cutting into
 // the curved head, which made parts of each eye disappear during rotation.
 for(let ring=0;ring<6;ring++)for(let j=0;j<32;j++){
  const a=j*Math.PI/16,b=(j+1)*Math.PI/16;
  faces.push({colour:'#000000',eye:true,points:[eye(ring/6,a),eye((ring+1)/6,a),eye((ring+1)/6,b),eye(ring/6,b)]});
 }

 for(let i=headStart;i<faces.length;i++)faces[i].head=true;
}
const smileStart=faces.length;
const smile:V[]=[];
for(let i=0;i<=16;i++){
 const x=-9+18*i/16,y=120+4*Math.sin(i*Math.PI/16);
 smile.push({x,y,z:-43*Math.sqrt(1-(x/56)**2-((y-85)/56)**2)-2});
}
tube(smile,.9,'#000000');
for(let i=smileStart;i<faces.length;i++)faces[i].head=true;

export type AlienMotion={ritualHands?:(V|undefined)[];ritualReach?:number[];ritualAmount?:number;outfit?:Outfit;ambient?:AmbientPose;stand?:number;gait?:number;moving?:number;reading?:number;life?:number};
export function alienVolume(yaw:number,down:number,standing=false,motion:AlienMotion={}){
 const stand=motion.stand??(standing?1:0),walk=motion.moving??0,phase=motion.gait??0,reading=motion.reading??0;
 const ambient=motion.ambient;
 const amount=ambient?.amount??0,gestureTime=ambient?.time??0;
 const scratch=ambient?.kind==='scratch'?amount:0,stretch=ambient?.kind==='stretch'?amount:0;
 const glance=ambient?.kind==='look'?amount:0;
 const headTurn=glance*(ambient?.side??1)*(.55*Math.cos(gestureTime*.65));
 const headPitch=glance*(-.32+.14*Math.sin(gestureTime*1.1))-stretch*.16;
 const life=motion.life??0,breath=motion.life===undefined?0:Math.sin(life*1.35)*.48;
 const pose=(p:V,face:Face):V=>{
  const bounce=(1-Math.cos(phase*2))*1.1*walk;


  const flex=face.antenna?Math.max(0,(38-p.y)/23):0;
  const antenna=flex*(Math.sin(phase-.65)*2.2*walk+(motion.life===undefined?0:Math.sin(life*(face.side===-1?1.13:.91)+(face.side??0))*.7));
  return {...p,x:p.x+antenna+flex*amount*Math.sin(gestureTime*2.1-.5)*2,y:face.head?p.y:p.y-38*stand-bounce};
 };
 // Rebuild round tubes around posed centre-lines. Deforming the original
 // vertices compressed their cross-sections into flat ribbons.
 const legs:Face[]=[];
 for(const side of [-1,1]){
  const kneeZ=side<0?-43:-40,step=Math.sin(phase+(side===-1?Math.PI:0));
  const points=[{x:side*10,y:202,z:2},{x:side*15,y:203,z:-21},{x:side*18,y:206,z:kneeZ},{x:side*19,y:223,z:kneeZ+1},{x:side*20,y:244,z:kneeZ+5}];
  const posed=points.map(p=>{
   const weight=Math.max(0,Math.min(1,(p.y-202)/43));
   return {x:p.x,y:p.y-38*stand*(1-Math.max(0,Math.min(1,-p.z/40)))*Math.max(0,Math.min(1,(218-p.y)/12))-Math.max(0,step)*6*weight*walk-(1-Math.cos(phase*2))*1.1*walk*(1-weight),z:p.z*(1-.88*stand)+step*8*weight*walk};
  });
  tube(posed,3,'#79cfb2',legs);
  const foot=posed[posed.length-1];
  sphere({...foot,y:foot.y+1,z:foot.z-5},{x:6,y:3,z:8},'#79cfb2',12,24,legs);
 }
 const arms:Face[]=[];
 for(const side of [-1,1]){
  const handY=side<0?198:196,handZ=side<0?-22:-25,step=Math.sin(phase+(side===-1?Math.PI:0)),bounce=(1-Math.cos(phase*2))*1.1*walk;
  const armPose=(p:V)=>{const weight=Math.max(0,Math.min(1,(p.y-138)/62));return {x:p.x+side*42*reading*weight,y:p.y-38*stand-bounce-reading*65*weight,z:p.z-step*9*weight*walk-reading*38*weight};};
  const points=[{x:side*12,y:138,z:0},{x:side*19,y:154,z:1},{x:side*25,y:181,z:-3},{x:side*22,y:191,z:-12},{x:side*13,y:handY,z:handZ}].map(armPose);
  const scratching=side===(ambient?.side??1)?scratch:0;
  // Lift through the elbow, then make three small fingertip strokes at the temple.
  const rub=gestureTime>1.2&&gestureTime<3.4?Math.sin((gestureTime-1.2)*9)*2:0;
  const reach=[{x:side*12,y:138,z:0},{x:side*39,y:139,z:-2},{x:side*65,y:115,z:-5},{x:side*60,y:86,z:-9},{x:side*53,y:65+rub,z:-12}];
  const opening=[{x:side*12,y:138,z:0},{x:side*27,y:142,z:-3},{x:side*46,y:150,z:-12},{x:side*48,y:131,z:-20},{x:side*40,y:118,z:-24}];
  const blend=(p:V,q:V,t:number)=>({x:p.x+(q.x-p.x)*t,y:p.y+(q.y-38*stand-p.y)*t,z:p.z+(q.z-p.z)*t});
  const posed=points.map((p,i)=>blend(blend(p,reach[i],scratching),opening[i],stretch));
  const hand=motion.ritualHands?.[side<0?0:1],reachAmount=(motion.ritualAmount??0)*(motion.ritualReach?.[side<0?0:1]??1);
  if(hand&&reachAmount>0){
   const shoulder=posed[0],elbow={x:shoulder.x+(hand.x-shoulder.x)*.48+side*5,y:shoulder.y+(hand.y-shoulder.y)*.60+9,z:shoulder.z+(hand.z-shoulder.z)*.45};
   const reach=[shoulder,{x:shoulder.x+(elbow.x-shoulder.x)*.5,y:shoulder.y+(elbow.y-shoulder.y)*.5,z:shoulder.z+(elbow.z-shoulder.z)*.5},elbow,{x:elbow.x+(hand.x-elbow.x)*.6,y:elbow.y+(hand.y-elbow.y)*.6,z:elbow.z+(hand.z-elbow.z)*.6},hand];
   for(let i=1;i<posed.length;i++)posed[i]={x:posed[i].x+(reach[i].x-posed[i].x)*reachAmount,y:posed[i].y+(reach[i].y-posed[i].y)*reachAmount,z:posed[i].z+(reach[i].z-posed[i].z)*reachAmount};
  }
  tube(posed,2.8,'#79cfb2',arms);
  if(motion.outfit==='soul-ringer-1'){
   const end={x:posed[0].x+(posed[1].x-posed[0].x)*.9,y:posed[0].y+(posed[1].y-posed[0].y)*.9,z:posed[0].z+(posed[1].z-posed[0].z)*.9};
   tube([posed[0],end],5.5,'#edece3',arms);
   const cuff={x:end.x+(posed[1].x-posed[0].x)*.08,y:end.y+(posed[1].y-posed[0].y)*.08,z:end.z+(posed[1].z-posed[0].z)*.08};
   tube([end,cuff],5.6,'#a62936',arms);
  }
  sphere(hand&&reachAmount>0?posed[4]:scratching||stretch?{...posed[4],y:posed[4].y+2}:armPose({x:side*13,y:handY+2,z:handZ}),{x:4,y:5,z:3},'#79cfb2',12,24,arms);
 }
 const garment:Face[]=[];
 if(motion.outfit==='soul-ringer-1'){
  // A hollow, softly tapered garment follows the torso, not a billboard.
  const rings=[{y:134,x:7,z:6.8},{y:142,x:17,z:11},{y:164,x:18,z:13},{y:193,x:17,z:12}];
  const ring=(r:typeof rings[number],a:number)=>({x:r.x*Math.cos(a),y:r.y,z:2+r.z*Math.sin(a)});
  for(let k=0;k<rings.length-1;k++)for(let j=0;j<32;j++){
   const a=j*Math.PI/16,b=(j+1)*Math.PI/16;
   garment.push({colour:'#edece3',points:[ring(rings[k],a),ring(rings[k+1],a),ring(rings[k+1],b),ring(rings[k],b)]});
  }
  tube(Array.from({length:33},(_,j)=>ring(rings[0],j*Math.PI/16)),1.5,'#a62936',garment);
  // The actual merchandise illustration wraps over the curved front in small cells.
  const surface=(u:number,v:number)=>{const x=(u-.5)*25;return {x,y:153+v*20,z:2-13.5*Math.sqrt(1-(x/18)**2)};};
  for(let y=0;y<6;y++)for(let x=0;x<8;x++){
   const uv=[{x:x/8,y:y/6},{x:(x+1)/8,y:y/6},{x:(x+1)/8,y:(y+1)/6},{x:x/8,y:(y+1)/6}];
   for(const indices of [[0,1,2],[0,2,3]])garment.push({colour:'#edece3',uv:indices.map(i=>uv[i]),points:indices.map(i=>surface(uv[i].x,uv[i].y))});
  }
 }
 const posedLimbs=new Set([...legs,...arms]);
 const paper:Face[]=[];
 if(reading>0){
  const paperPoint=(x:number,y:number):V=>({x,y:90+(y-90)*reading+100*(1-reading),z:-67+(y-90)*.16+Math.abs(x)*.06});
  const panel=(x:number,y:number,w:number,h:number,colour:string)=>paper.push({colour,points:[paperPoint(x,y),paperPoint(x+w,y),paperPoint(x+w,y+h),paperPoint(x,y+h)]});
  panel(-60,45,60,110,'#d9d3b9');panel(0,45,60,110,'#eee7d3');
  const glyphs=['101101111101101','101101010010010','110101110100100','111100110100111','110101110101101','000000000000000','111100110100100','111010010010111','101101010101101'];
  glyphs.forEach((glyph,index)=>[...glyph].forEach((ink,i)=>{if(ink==='1')panel(-42+index*9.4+(i%3)*2.1,52+Math.floor(i/3)*2.1,1.6,1.6,'#454638');}));
  for(const x of [-53,7])for(let row=0;row<13;row++)panel(x,72+row*5.6,45-(row%3)*4,.65,'#a6a18e');
 }

 const angle=yaw*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle),pitch=Math.max(-1,Math.min(1,down+headPitch))*45*Math.PI/180;
 const rotate=(p:V,head=false)=>{let {x,y,z}=p;if(head){const hx=x;x=hx*Math.cos(headTurn)+z*Math.sin(headTurn);z=z*Math.cos(headTurn)-hx*Math.sin(headTurn);const t=Math.max(0,Math.min(1,(y-92)/49));const taper=t*t*(3-2*t);x*=1-.28*taper;y+=7*taper;const dy=y-120;y=120+dy*Math.cos(pitch)-z*Math.sin(pitch);z=dy*Math.sin(pitch)+z*Math.cos(pitch);y-=26+38*stand+(1-Math.cos(phase*2))*1.1*walk;}// Breathing settles around planted hips/feet; head and held paper share the lift.
 const supported=Math.max(0,Math.min(1,(244-y)/100));
 const settle=motion.life===undefined?0:Math.sin(life*.23)*Math.sin(life*.37)*.45*(1-walk);
 // A seated adjustment pivots above planted hips; the chair and feet stay fixed.
 const upper=Math.max(0,Math.min(1,(202-38*stand-y)/75));
 x+=stretch*2.8*Math.sin(gestureTime*.8)*upper;
 z-=stretch*3*upper;
 x+=(settle+Math.sin(phase)*3.5*walk)*supported;
 y-=breath*(reading>.5?1:supported);
 return {x:90+x*c+z*s,y,z:z*c-x*s};};
 // Keep each page's printed marks attached to its paper surface instead of
 // sorting coplanar ink behind the much larger sheet polygon.
 const pageDepth=paper.slice(0,2).map(face=>face.points.reduce((sum,p)=>sum+rotate(pose(p,face)).z,0)/face.points.length);
 const paperOrder=new Map(paper.map((face,i)=>[face,i]));
 return [...faces.filter(face=>!face.leg&&!face.arm),...legs,...arms,...garment,...paper].filter(face=>{
  if(!face.eye)return true;
  const centre=face.points.reduce((v,p)=>({x:v.x+p.x/face.points.length,y:0,z:v.z+p.z/face.points.length}),{x:0,y:0,z:0});
  return centre.z/43**2*Math.cos(angle+headTurn)-centre.x/56**2*Math.sin(angle+headTurn)>0;
 }).map(face=>{
  const p=face.points.map(p=>rotate(posedLimbs.has(face)?p:pose(p,face),face.head)).map(v=>({x:+v.x.toFixed(6),y:+v.y.toFixed(6),z:+v.z.toFixed(6)})),a=p[0],b=p[1],d=p[2];
  const nx=(b.y-a.y)*(d.z-a.z)-(b.z-a.z)*(d.y-a.y),ny=(b.z-a.z)*(d.x-a.x)-(b.x-a.x)*(d.z-a.z),nz=(b.x-a.x)*(d.y-a.y)-(b.y-a.y)*(d.x-a.x);
  const length=Math.hypot(nx,ny,nz)||1;
  const light=.83+.17*Math.max(0,(-nx*.3-ny*.5+nz*.8)/length);
  const rgb=face.colour.slice(1).match(/../g)!.map(v=>parseInt(v,16));
  const printed=paperOrder.get(face),page=face.points[0].x<0?0:1;
  return {texture:face.uv?{points:p,uv:face.uv}:undefined,d:`M${p.map(v=>`${v.x.toFixed(2)},${v.y.toFixed(2)}`).join('L')}Z`,depth:printed!==undefined?1000+pageDepth[page]+(printed>1?.001:0):(face.eye?100:0)+(+(p.reduce((sum,v)=>sum+v.z,0)/p.length).toFixed(5)),fill:face.colour==='#000000'?'#000000':`rgb(${rgb.map((v,i)=>Math.round(v*light+(i===0?5:0))).join(',')})`};
 }).sort((a,b)=>a.depth-b.depth);
}

/** Resolve the look vector on either side of the console, retaining rearward attention. */
export function alienLookYaw(x:number,back:number){
 return Math.atan2(-x*.55,Math.cos(back*Math.PI))*180/Math.PI;
}

/** Scene-relative cursor: x is -1..1 around the centred pilot; y is 0..1. */
export function alienNodTarget(x:number,y:number){
 const vertical=Math.max(-1,Math.min(1,(y-.5)*2));
 // Smooth exponential falloff avoids a sudden change crossing the centre.
 return vertical>0 ? vertical*Math.exp(-4*x*x) : vertical;
}

/** Face the camera at/below the antennae; turn toward the dome only above them. */
export function alienFacingTarget(y:number,antennaY:number,turnRange:number){
 const t=Math.max(0,Math.min(1,1+(y-antennaY)/Math.max(turnRange,.0001)));
 return t*t*(3-2*t);
}

/** Animate the shortest physical turn, including the centre-line 180° target flip. */
export function advanceAlienYaw(current:number,target:number,dt:number){
 const delta=((target-current+540)%360+360)%360-180;
 if(Math.abs(delta)<.01)return current+delta;
 const limit=240*Math.max(0,dt);
 return current+Math.max(-limit,Math.min(limit,delta*(1-Math.exp(-10*Math.max(0,dt)))));
}

/** Fast locomotion steering only; seated cursor tracking retains its existing response. */
export function walkingTurn(current:number,target:number,dt:number){
 const delta=((target-current+540)%360+360)%360-180;
 const step=Math.min(1080*Math.max(0,dt),Math.abs(delta)*(1-Math.exp(-28*Math.max(0,dt))));
 const yaw=Math.abs(delta)<.15?current+delta:current+Math.sign(delta)*step;
 return {yaw,canTravel:Math.abs(delta)<=22};
}
