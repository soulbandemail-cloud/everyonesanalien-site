import type {CoffeePose} from './coffee';
import {guitarPoint} from './charlieEmotes';
import type {EmotePose} from './charlieEmotes';
import type {Outfit} from './clothing';
import {ambientJoints,type AmbientPose} from './charlieAmbient';
/** Small illustrated meshes in the pilot's existing 180 × 250 drawing space. */
type V = {x:number;y:number;z:number};
type Face = {uv?:{x:number;y:number}[];points:V[];colour:string;eye?:boolean;head?:boolean;mouth?:boolean;leg?:boolean;arm?:boolean;antenna?:boolean;side?:number};
const faces:Face[]=[];
// Reuse tessellation angles and colour parsing across animated frames.
const sphereAngles=new Map<string,number[][][]>();
const colours=new Map<string,number[]>();
const sphere=(centre:V,r:V,colour:string,rows=12,cols=24,output:Face[]=faces)=>{
 const key=`${rows}/${cols}`;
 let angles=sphereAngles.get(key);
 if(!angles){
  const vertex=(i:number,j:number)=>{const a=i*Math.PI/rows,b=j*2*Math.PI/cols;return [Math.sin(a),Math.cos(a),Math.cos(b),Math.sin(b)];};
  angles=[];
  for(let i=0;i<rows;i++)for(let j=0;j<cols;j++)angles.push([vertex(i,j),vertex(i+1,j),vertex(i+1,j+1),vertex(i,j+1)]);
  sphereAngles.set(key,angles);
 }
 for(const quad of angles)output.push({colour,points:quad.map(([sa,ca,cb,sb])=>({x:centre.x+r.x*sa*cb,y:centre.y+r.y*ca,z:centre.z+r.z*sa*sb}))});
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
  // Adjacent segments share the same joint; draw it once, not twice.
  if(i===0)sphere(a,{x:radius,y:radius,z:radius},colour,6,10,output);
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
for(let i=smileStart;i<faces.length;i++){faces[i].head=true;faces[i].mouth=true;}

export type AlienMotion={coffee?:CoffeePose;blink?:number;cursorHeadYaw?:number;telescope?:boolean;emote?:EmotePose;ritualHands?:(V|undefined)[];ritualReach?:number[];ritualAmount?:number;outfit?:Outfit;ambient?:AmbientPose;stand?:number;gait?:number;moving?:number;reading?:number;life?:number};
export function alienVolume(yaw:number,down:number,standing=false,motion:AlienMotion={},canvasOnly=false){
 const stand=motion.stand??(standing?1:0),walk=motion.moving??0,phase=motion.gait??0,reading=motion.reading??0;
 const wave=motion.emote;
 const ambient=motion.ambient;
 const amount=ambient?.amount??0;
 const scratch=ambient?.kind==='scratch'?amount:0,stretch=ambient?.kind==='stretch'?amount:0;
 const idle=ambientJoints(ambient);
 const headTurn=idle.headYaw+(motion.cursorHeadYaw??0);
 const headPitch=0;
 const fullStretch=stand>.99?idle.extension:0;
 const life=motion.life??0,breath=motion.life===undefined?0:Math.sin(life*1.35)*.48;
 const pose=(p:V,face:Face):V=>{
  const bounce=(1-Math.cos(phase*2))*1.1*walk;


  const flex=face.antenna?Math.max(0,(38-p.y)/23):0;
  const antenna=flex*(Math.sin(phase-.65)*2.2*walk+(motion.life===undefined?0:Math.sin(life*(face.side===-1?1.13:.91)+(face.side??0))*.7));
  return {...p,x:p.x+antenna+flex*(wave?.antennaSway??0)+(face.side??0)*flex*(wave?.droop??0)*8+flex*idle.antenna,y:face.head?p.y+flex*(wave?.droop??0)*12:p.y-38*stand-bounce};
 };
 // Rebuild round tubes around posed centre-lines. Deforming the original
 // vertices compressed their cross-sections into flat ribbons.
 const legs:Face[]=[];
 for(const side of [-1,1]){
  const kneeZ=side<0?-43:-40,step=Math.sin(phase+(side===-1?Math.PI:0));
  const points=[{x:side*10,y:202,z:2},{x:side*15,y:203,z:-21},{x:side*18,y:206,z:kneeZ},{x:side*19,y:223,z:kneeZ+1},{x:side*20,y:244,z:kneeZ+5}];
  const posed=points.map(p=>{
   const weight=Math.max(0,Math.min(1,(p.y-202)/43));
   return {x:p.x+(wave?(side<0?wave.stepL:wave.stepR)*weight:0),y:p.y-(wave?(side<0?wave.liftL:wave.liftR)*weight:0)+ (wave?.kneeBend?0:(wave?.bodyY??0))*(1-weight)-38*stand*(1-Math.max(0,Math.min(1,-p.z/40)))*Math.max(0,Math.min(1,(218-p.y)/12))-Math.max(0,step)*6*weight*walk-(1-Math.cos(phase*2))*1.1*walk*(1-weight),z:p.z*(1-.88*stand)+step*8*weight*walk-(wave?.kneeBend??0)*4*weight*(1-weight)};
  });
  if(fullStretch)for(const p of posed)p.y-=fullStretch*2*Math.max(0,Math.min(1,(p.y-225)/19));
  tube(posed,3,'#79cfb2',legs);
  const foot=posed[posed.length-1];
  const footStart=legs.length;
  sphere({...foot,y:foot.y+1,z:foot.z-5},{x:6,y:3,z:8},'#79cfb2',12,24,legs);
  if(fullStretch)for(const face of legs.slice(footStart))for(const p of face.points){
   const a=fullStretch*.16,dy=p.y+fullStretch*2-247,dz=p.z-(foot.z-13);
   p.y=247+dy*Math.cos(a)-dz*Math.sin(a);p.z=foot.z-13+dy*Math.sin(a)+dz*Math.cos(a);
  }
 }
 const arms:Face[]=[];
 for(const side of [-1,1]){
  const handY=side<0?198:196,handZ=side<0?-22:-25,step=Math.sin(phase+(side===-1?Math.PI:0)),bounce=(1-Math.cos(phase*2))*1.1*walk;
  const armPose=(p:V)=>{const weight=Math.max(0,Math.min(1,(p.y-138)/62));return {x:p.x+side*42*reading*weight,y:p.y-38*stand-bounce-reading*65*weight+(motion.coffee?.lower??0)*53*weight,z:p.z-step*9*weight*walk-reading*38*weight};};
  const points=[{x:side*12,y:138,z:0},{x:side*19,y:154,z:1},{x:side*25,y:181,z:-3},{x:side*22,y:191,z:-12},{x:side*13,y:handY,z:handZ}].map(armPose);
  const scratching=side===(ambient?.side??1)?scratch:0;
  // Lift through the elbow, then make three small fingertip strokes at the temple.
  const rub=idle.rub;
  // Follow the temple surface, keeping a hand-radius clearance from the skull.
  const templeY=65+rub,templeX=56*Math.sqrt(Math.max(0,1-((templeY-85)/56)**2-(-12/43)**2))+3;
  const reach=[{x:side*12,y:138,z:0},{x:side*36,y:136+rub*.12,z:-2},{x:side*61,y:110+rub*.3,z:-5},{x:side*(templeX+5),y:84+rub*.7,z:-9},{x:side*templeX,y:templeY,z:-12}];
  const opening=[{x:side*12,y:138,z:0},{x:side*27,y:142,z:-3},{x:side*46,y:150,z:-12},{x:side*48,y:131,z:-20},{x:side*40,y:118,z:-24}];
  const blend=(p:V,q:V,t:number)=>({x:p.x+(q.x-p.x)*t,y:p.y+(q.y-38*stand-p.y)*t,z:p.z+(q.z-p.z)*t});
  const overhead=[{x:side*12,y:138,z:0},{x:side*40,y:108,z:-3},{x:side*73,y:68,z:-5},{x:side*76,y:17,z:-5},{x:side*70,y:-12,z:-4}];
  const posed=points.map((p,i)=>blend(blend(blend(p,reach[i],scratching),opening[i],stretch),overhead[i],fullStretch));
  const gesture=wave?.arms[side<0?0:1];
  if(gesture&&gesture.weight>0){
   const h={x:gesture.hand[0],y:gesture.hand[1],z:gesture.hand[2]},e={x:gesture.elbow[0],y:gesture.elbow[1],z:gesture.elbow[2]},shoulder=posed[0];
   const target=[shoulder,{x:(shoulder.x+e.x)/2,y:(shoulder.y+e.y)/2,z:(shoulder.z+e.z)/2},e,{x:e.x+(h.x-e.x)*.72,y:e.y+(h.y-e.y)*.72,z:e.z+(h.z-e.z)*.72},h];
   for(let i=1;i<posed.length;i++)posed[i]={x:posed[i].x+(target[i].x-posed[i].x)*gesture.weight,y:posed[i].y+(target[i].y-posed[i].y)*gesture.weight,z:posed[i].z+(target[i].z-posed[i].z)*gesture.weight};
  }
  const hand=side===-1&&motion.coffee?motion.coffee.hand:motion.ritualHands?.[side<0?0:1],reachAmount=side===-1&&motion.coffee?motion.coffee.reach:(motion.ritualAmount??0)*(motion.ritualReach?.[side<0?0:1]??1);
  if(hand&&reachAmount>0){
   const shoulder=posed[0],elbow={x:shoulder.x+(hand.x-shoulder.x)*.48+side*5,y:shoulder.y+(hand.y-shoulder.y)*.60+9,z:shoulder.z+(hand.z-shoulder.z)*.45};
   // Keep telescope elbows outside the torso instead of taking a diagonal
   // shortcut through Charlie's back to the shared eyepiece hand targets.
   if(motion.telescope){elbow.x=side*Math.max(20,Math.abs(elbow.x));elbow.y=shoulder.y+(hand.y-shoulder.y)*.5+13;elbow.z=shoulder.z+(hand.z-shoulder.z)*.55;}
   const reach=[shoulder,{x:shoulder.x+(elbow.x-shoulder.x)*.5,y:shoulder.y+(elbow.y-shoulder.y)*.5,z:shoulder.z+(elbow.z-shoulder.z)*.5},elbow,{x:elbow.x+(hand.x-elbow.x)*.6,y:elbow.y+(hand.y-elbow.y)*.6,z:elbow.z+(hand.z-elbow.z)*.6},hand];
   for(let i=1;i<posed.length;i++)posed[i]={x:posed[i].x+(reach[i].x-posed[i].x)*reachAmount,y:posed[i].y+(reach[i].y-posed[i].y)*reachAmount,z:posed[i].z+(reach[i].z-posed[i].z)*reachAmount};
  }
  // Route raised arms around the head during entry as well as the held pose.
  const clearHead=(p:V):V=>{
   const cross=1-((p.y-21)/64)**2-(p.z/50)**2;
   return cross>0?{...p,x:side*Math.max(Math.abs(p.x),64*Math.sqrt(cross))}:p;
  };
  if((gesture&&gesture.weight>0)||fullStretch>0)for(let i=1;i<posed.length;i++)posed[i]=clearHead(posed[i]);
  const armCurve=gesture&&gesture.weight>0?[posed[0],...Array.from({length:7},(_,i)=>{
   const t=i/6,a=posed[1],b=posed[2],c=posed[3];
   return clearHead({x:(1-t)**2*a.x+2*t*(1-t)*b.x+t*t*c.x,y:(1-t)**2*a.y+2*t*(1-t)*b.y+t*t*c.y,z:(1-t)**2*a.z+2*t*(1-t)*b.z+t*t*c.z});
  }),posed[4]]:posed;
  tube(armCurve,2.8,'#79cfb2',arms);
  if(motion.outfit==='soul-ringer-1'){
   const end={x:posed[0].x+(posed[1].x-posed[0].x)*.9,y:posed[0].y+(posed[1].y-posed[0].y)*.9,z:posed[0].z+(posed[1].z-posed[0].z)*.9};
   tube([posed[0],end],5.5,'#edece3',arms);
   const cuff={x:end.x+(posed[1].x-posed[0].x)*.08,y:end.y+(posed[1].y-posed[0].y)*.08,z:end.z+(posed[1].z-posed[0].z)*.08};
   tube([end,cuff],5.6,'#a62936',arms);
  }
  sphere(gesture&&gesture.weight>0?posed[4]:hand&&reachAmount>0?posed[4]:scratching||stretch||fullStretch?{...posed[4],y:posed[4].y+2}:armPose({x:side*13,y:handY+2,z:handZ}),{x:4,y:5,z:3},'#79cfb2',12,24,arms);
  if(gesture&&gesture.weight>0){
   const h=posed[4],finger=(pts:V[],amount:number)=>{if(amount>.001)tube(pts.map(p=>({x:h.x+(p.x-h.x)*amount,y:h.y+(p.y-h.y)*amount,z:h.z+(p.z-h.z)*amount})),1.35,'#79cfb2',arms);};
   const strength=gesture.weight;
   if(gesture.heart>0){
    // Each hand supplies one lobe and one half of the pointed thumb base.
    const bezier=(a:V,b:V,c:V,d:V)=>Array.from({length:13},(_,i)=>{const t=i/12,u=1-t;return {x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y,z:h.z};});
    finger(bezier(h,{x:side*24,y:-75,z:h.z},{x:side*6,y:-79,z:h.z},{x:0,y:-65,z:h.z}),gesture.heart*strength);
    finger(bezier(h,{x:side*10,y:-49,z:h.z},{x:side*3,y:-45,z:h.z},{x:0,y:-42,z:h.z}),gesture.heart*strength);
   }else if(gesture.peace>0||gesture.index>0){
    finger([h,{x:h.x-2*(1+.5*gesture.peace),y:h.y-5*(1+.5*gesture.peace),z:h.z},{x:h.x-9*gesture.peace,y:h.y-17-16*gesture.peace,z:h.z}],strength);
    if(gesture.peace>0)finger([h,{x:h.x+4.5,y:h.y-7.5,z:h.z},{x:h.x+10.5,y:h.y-31.5,z:h.z}],strength*gesture.peace);
    for(let j=0;j<2;j++)sphere({x:h.x+2+j*2,y:h.y-1,z:h.z-2},{x:1.8,y:2,z:1.8},'#79cfb2',5,8,arms);
   }else if(gesture.open>0)for(let j=0;j<4;j++)finger([h,{x:h.x+(j-1.5)*2,y:h.y-3,z:h.z},{x:h.x+(j-1.5)*3,y:h.y-9+Math.abs(j-1.5),z:h.z}],strength*gesture.open);
  }

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
 const expression:Face[]=[];
 const expressiveMouth=wave&&Math.max(wave.yawn,wave.smileOpen,wave.frown,wave.pout)>.01;
 if(wave&&expressiveMouth){
  const surface=(x:number,y:number):V=>({x,y,z:-43*Math.sqrt(Math.max(.01,1-(x/56)**2-((y-85)/56)**2))-2.5});
  if(wave.smileOpen>.01){
   // A filled rounded bowl; keep the entire opening just above the face surface.
   const edge=Array.from({length:33},(_,i)=>{const a=i*Math.PI/16,x=12.5*Math.cos(a),y=121+(Math.sin(a)<0?2.5:7)*Math.sin(a)*wave.smileOpen;return surface(x,y);});
   const centre=surface(0,122);
   for(let i=0;i<edge.length-1;i++)expression.push({colour:'#000000',eye:true,points:[centre,edge[i],edge[i+1]]});
  }else if(wave.frown>.01){
   tube(Array.from({length:17},(_,i)=>surface(-8+i,123-3*wave.frown*Math.sin(i*Math.PI/16))),.9,'#000000',expression);
  }else if(wave.pout>.01){
   tube(Array.from({length:21},(_,i)=>{const a=i*Math.PI/10;return surface(3*wave.pout*Math.cos(a),121+2.6*wave.pout*Math.sin(a));}),1,'#000000',expression);
  }else sphere(surface(0,120),{x:4*wave.yawn,y:7*wave.yawn,z:1},'#000000',8,12,expression);
  expression.forEach(f=>{f.head=true;f.eye=true;f.mouth=true;});
 }

 const prop:Face[]=[];
 if(wave&&wave.guitar>0){
  const gp=(u:number,v:number,z=0):V=>{const p=guitarPoint(-u*wave.guitar,v*wave.guitar,z);return {x:p[0],y:p[1],z:p[2]};};
  const poly=(points:number[][],colour:string,z=0)=>prop.push({colour,points:points.map(([u,v])=>gp(u,v,z))});
  const shape=[[-9,-3],[-30,64],[-26,67],[0,35],[26,67],[30,64],[9,-3]];
  poly(shape,'#087c9e',3);poly(shape,'#08b8df',-3);
  shape.forEach((p,i)=>{const q=shape[(i+1)%shape.length];prop.push({colour:i%2?'#159fbc':'#45d2ed',points:[gp(...p as [number,number],-3),gp(...q as [number,number],-3),gp(...q as [number,number],3),gp(...p as [number,number],3)]});});
  poly([[-7,1],[-21,43],[-2,25],[8,25],[11,45],[24,58],[7,1]],'#f1edf7',-3.5);
  poly([[-4,-3],[-4,-64],[4,-64],[4,-3]],'#252624',-3.7);
  poly([[-4,-64],[-8,-70],[-5,-88],[-3,-92],[0,-93],[3,-92],[5,-88],[8,-70],[4,-64]],'#08b8df',-3.7);
  poly([[-3,-64],[-4,-71],[0,-79],[4,-71],[3,-64]],'#eeece6',-8);
  for(const v of [7,19,28,34])poly([[-6,v],[6,v],[6,v+3],[-6,v+3]],'#bdc8c9',-4);
  for(let v=-60;v<-4;v+=5)poly([[-4,v],[4,v],[4,v+.4],[-4,v+.4]],'#a9aaa3',-4);
  for(let u=-2.5;u<=2.5;u++)poly([[u,-82],[u+.13,-82],[u+.13,35],[u,35]],'#e3dfcd',-9);
  for(const [u,v] of [[14,32],[14,39],[20,41]])sphere(gp(u,v,-4),{x:2,y:2,z:1},'#202124',5,8,prop);
  for(const v of [-72,-78,-84])for(const side of [-1,1])sphere(gp(side*6,v,-3),{x:2,y:1.5,z:1.5},'#bfc9c9',5,8,prop);
 }
 const propOrder=new Map(prop.map((face,i)=>[face,i]));
 const posedLimbs=new Set([...legs,...arms,...prop]),posedLegs=new Set(legs);
 const paper:Face[]=[];
 if(reading>0){
  const paperPoint=(x:number,y:number):V=>{
   const lower=motion.coffee?.lower??0,tilt=lower*75*Math.PI/180;
   const py=90+(y-90)*reading+100*(1-reading),pz=-67+(y-90)*.16+Math.abs(x)*.06;
   // Hinge at the near/lap edge: the upper edge tips forward towards the table.
   // Apply this to the ink and paper together so the whole sheet stays rigid.
   const dy=py-155,dz=pz-(-56.6+Math.abs(x)*.06);
   return {x,y:155+dy*Math.cos(tilt)-dz*Math.sin(tilt)+35*lower,z:-56.6+Math.abs(x)*.06+dy*Math.sin(tilt)+dz*Math.cos(tilt)};
  };
  const panel=(x:number,y:number,w:number,h:number,colour:string)=>paper.push({colour,points:[paperPoint(x,y),paperPoint(x+w,y),paperPoint(x+w,y+h),paperPoint(x,y+h)]});
  panel(-60,45,60,110,'#d9d3b9');panel(0,45,60,110,'#eee7d3');
  const glyphs=['101101111101101','101101010010010','110101110100100','111100110100111','110101110101101','000000000000000','111100110100100','111010010010111','101101010101101'];
  glyphs.forEach((glyph,index)=>[...glyph].forEach((ink,i)=>{if(ink==='1')panel(-42+index*9.4+(i%3)*2.1,52+Math.floor(i/3)*2.1,1.6,1.6,'#454638');}));
  for(const x of [-53,7])for(let row=0;row<13;row++)panel(x,72+row*5.6,45-(row%3)*4,.65,'#a6a18e');
 }

 const angle=(yaw+(wave?.turn??0))*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle),pitch=Math.max(-1,Math.min(1,down+headPitch+(wave?.headNod??0)))*45*Math.PI/180;
 const rotate=(p:V,head=false,leg=false)=>{let {x,y,z}=p;if(head){const t=Math.max(0,Math.min(1,(y-92)/49));const taper=t*t*(3-2*t);x*=1-.28*taper;y+=7*taper;
 const hx=x;x=hx*Math.cos(headTurn)+z*Math.sin(headTurn);z=z*Math.cos(headTurn)-hx*Math.sin(headTurn);
 // The autonomous nod hinges at the neck attachment, preserving neck length.
 const idleDy=y-148;y=148+idleDy*Math.cos(idle.headPitch)-z*Math.sin(idle.headPitch);z=idleDy*Math.sin(idle.headPitch)+z*Math.cos(idle.headPitch);
 if(wave){const dy=y-85,xx=x;x=x*Math.cos(wave.headTilt)+dy*Math.sin(wave.headTilt);y=85+dy*Math.cos(wave.headTilt)-xx*Math.sin(wave.headTilt);}
 const dy=y-120;y=120+dy*Math.cos(pitch)-z*Math.sin(pitch);z=dy*Math.sin(pitch)+z*Math.cos(pitch);y-=26+38*stand+(1-Math.cos(phase*2))*1.1*walk;}// Breathing settles around planted hips/feet; head and held paper share the lift.
 const supported=Math.max(0,Math.min(1,(244-y)/100));
 const settle=motion.life===undefined?0:Math.sin(life*.23)*Math.sin(life*.37)*.45*(1-walk);
 // A seated adjustment pivots above planted hips; the chair and feet stay fixed.
 const upper=Math.max(0,Math.min(1,(202-38*stand-y)/75));
 // Rigid upper-body rotations share a hip pivot; seated hips never slide.
 const hipY=202-38*stand;
 if(motion.coffee&&!leg){const weight=Math.max(0,Math.min(1,(202-y)/64));z-=motion.coffee.lean*3*weight;}
 const jointWeight=leg?Math.max(0,Math.min(1,(222-y)/20)):1;
 const originalIdle={x,y,z};
 const twist=idle.torsoYaw,oldIdleX=x;x=x*Math.cos(twist)+z*Math.sin(twist);z=z*Math.cos(twist)-oldIdleX*Math.sin(twist);
 const lean=idle.lean,dyIdle=y-hipY,xxIdle=x;
 x=x*Math.cos(lean)+dyIdle*Math.sin(lean);y=hipY+dyIdle*Math.cos(lean)-xxIdle*Math.sin(lean);
 const back=idle.recline-fullStretch*.025,dyBack=y-hipY;
 y=hipY+dyBack*Math.cos(back)+z*Math.sin(back);z=-dyBack*Math.sin(back)+z*Math.cos(back);
 y-=fullStretch*3;
 x=originalIdle.x+(x-originalIdle.x)*jointWeight;y=originalIdle.y+(y-originalIdle.y)*jointWeight;z=originalIdle.z+(z-originalIdle.z)*jointWeight;
 if(motion.telescope){z-=7*upper*(motion.ritualAmount??0);y+=3*upper*(motion.ritualAmount??0);}
 x+=(settle+Math.sin(phase)*3.5*walk)*supported;
 y-=breath*(reading>.5?1:supported);
 if(wave&&(wave.hipTwist||wave.shoulderTwist)){
  // Continuous torso torsion carries the shirt and shoulders with the body.
  // Fade hip rotation down the legs to leave both feet planted.
  const upper=Math.max(0,Math.min(1,(164-y)/64));
  const twist=leg?wave.hipTwist*Math.max(0,Math.min(1,(238-y)/74)):wave.hipTwist+(wave.shoulderTwist-wave.hipTwist)*upper;
  const oldX=x;x=x*Math.cos(twist)+z*Math.sin(twist);z=z*Math.cos(twist)-oldX*Math.sin(twist);
 }
 if(wave){const original={x,y,z},weight=leg?Math.max(0,Math.min(1,(220-y)/40)):1;y+=wave.bodyY;x+=wave.hipX*Math.max(0,Math.min(1,(244-y)/70));const pivotY=164,dyPitch=y-pivotY;y=pivotY+dyPitch*Math.cos(wave.pitch)-z*Math.sin(wave.pitch);z=dyPitch*Math.sin(wave.pitch)+z*Math.cos(wave.pitch);const a=wave.lean,dy=y-(202-38*stand),oldX=x;x=x*Math.cos(a)+dy*Math.sin(a);y=202-38*stand+dy*Math.cos(a)-oldX*Math.sin(a);x=original.x+(x-original.x)*weight;y=original.y+(y-original.y)*weight;z=original.z+(z-original.z)*weight;}
 return {x:90+x*c+z*s,y,z:z*c-x*s};};
 // Keep each page's printed marks attached to its paper surface instead of
 // sorting coplanar ink behind the much larger sheet polygon.
 const pageDepth=paper.slice(0,2).map(face=>face.points.reduce((sum,p)=>sum+rotate(pose(p,face)).z,0)/face.points.length);
 const propDepth=prop.length?rotate({x:12,y:140,z:-34}).z:0;
 const paperOrder=new Map(paper.map((face,i)=>[face,i]));
 return [...faces.filter(face=>!face.leg&&!face.arm),...legs,...arms,...garment,...paper,...prop,...expression].filter(face=>{
  if(face.mouth&&expressiveMouth&&!expression.includes(face))return false;
  if(!face.eye)return true;
  const centre=face.points.reduce((v,p)=>({x:v.x+p.x/face.points.length,y:0,z:v.z+p.z/face.points.length}),{x:0,y:0,z:0});
  return centre.z/43**2*Math.cos(angle+headTurn)-centre.x/56**2*Math.sin(angle+headTurn)>0;
 }).map(face=>{
  if(!face.eye||face.mouth||!motion.blink||wave?.eyes)return face;
  // Eyelids cover the original surface patches: no scaling of the eye itself.
  // Clip from above and below to leave a fine, sloping closed-lid seam.
  const closure=Math.max(0,Math.min(1,motion.blink));
  let points=face.points;
  for(const [boundary,sign] of [[-24*(1-closure),1],[24*(1-closure)+.7*closure,-1]]){
   const distance=(p:V)=>(p.y-94+(Math.abs(p.x)-26)*Math.tan(Math.PI/6)-boundary)*sign;
   const clipped:V[]=[];
   for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length],da=distance(a),db=distance(b);
    if(da>=0)clipped.push(a);
    if((da>=0)!==(db>=0)){
     const t=da/(da-db),x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
     clipped.push({x,y,z:-43*Math.sqrt(Math.max(0,1-(x/56)**2-((y-85)/56)**2))-2});
    }
   }
   points=clipped;
  }
  return {...face,points};
 }).filter(face=>face.points.length>=3).map(face=>{
  const p=face.points.map(p=>face.eye&&!face.mouth&&wave?.eyes?{...p,y:94+(p.y-94)*(1-wave.eyes*.9)}:p).map(p=>rotate(posedLimbs.has(face)?p:pose(p,face),face.head,posedLegs.has(face))).map(v=>({x:+v.x.toFixed(6),y:+v.y.toFixed(6),z:+v.z.toFixed(6)})),a=p[0],b=p[1],d=p[2];
  const nx=(b.y-a.y)*(d.z-a.z)-(b.z-a.z)*(d.y-a.y),ny=(b.z-a.z)*(d.x-a.x)-(b.x-a.x)*(d.z-a.z),nz=(b.x-a.x)*(d.y-a.y)-(b.y-a.y)*(d.x-a.x);
  const length=Math.hypot(nx,ny,nz)||1;
  const light=.83+.17*Math.max(0,(-nx*.3-ny*.5+nz*.8)/length);
  let rgb=colours.get(face.colour);
  if(!rgb){rgb=face.colour.slice(1).match(/../g)!.map(v=>parseInt(v,16));colours.set(face.colour,rgb);}
  const printed=paperOrder.get(face),page=face.points[0].x<0?0:1;
  return {points:canvasOnly?p.map(v=>({x:Math.round(v.x*100)/100,y:Math.round(v.y*100)/100})):undefined,texture:face.uv?{points:p,uv:face.uv}:undefined,d:canvasOnly?'':`M${p.map(v=>`${v.x.toFixed(2)},${v.y.toFixed(2)}`).join('L')}Z`,depth:propOrder.has(face)?propDepth+propOrder.get(face)!*.00001:printed!==undefined?1000+pageDepth[page]+(printed>1?.001:0):(face.eye?100:0)+(+(p.reduce((sum,v)=>sum+v.z,0)/p.length).toFixed(5)),fill:face.colour==='#000000'?'#000000':`rgb(${rgb.map((v,i)=>Math.round(v*light+(i===0?5:0))).join(',')})`};
 }).sort((a,b)=>a.depth-b.depth);
}

/** Resolve the look vector on either side of the console, retaining rearward attention. */
export function alienLookYaw(x:number,back:number,swivel=0){
 return Math.atan2(-x*.55,Math.cos(back*Math.PI))*180/Math.PI+swivel;
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

/** Camera-projected landmarks, in the same logical viewport coordinates as the pointer.
 * The foreground rises back towards eye level after passing the chair pedestal. */
export function seatedGaze(x:number,y:number,landmarks:{pilotX:number;antennaY:number;chairBaseY:number;alienHeight:number;viewportHeight:number;leftAnchorX?:number;rightAnchorX?:number}){
 const {pilotX,antennaY,chairBaseY,alienHeight,viewportHeight}=landmarks;
 const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
 const dx=(x-pilotX)/Math.max(1,alienHeight);
 const down=y<=chairBaseY
  ? - .25+1.25*smooth((y-antennaY)/Math.max(1,chairBaseY-antennaY))
  : 1-.88*smooth((y-chairBaseY)/Math.max(1,viewportHeight-chairBaseY));
 // A virtual camera-side target plane: lateral offset stays unsaturated.
 // Targets near the chair's floor line are beside him; foreground targets
 // gain apparent depth, bringing the same horizontal offset nearer face-on.
 // The rounded distance avoids a cusp when tracing across the pedestal line.
 const dy=(y-chairBaseY)/Math.max(1,alienHeight);
 const depth=Math.hypot(.42,dy*1.25);
 // alienLookYaw consumes a lateral/depth ratio with a legacy .55 factor.
 // Cancel that factor here, leaving other callers and transition logic intact.
 const back=alienFacingTarget(y,antennaY,alienHeight*.6);
 // Preserve the inner mapping exactly. Beyond the projected side anchors,
 // turn back towards the camera as targets continue out along the parapet.
 const anchorX=x<pilotX?landmarks.leftAnchorX:landmarks.rightAnchorX;
 const anchor=anchorX===undefined?Infinity:Math.abs(anchorX-pilotX)/Math.max(1,alienHeight);
 const radius=Math.hypot(dx,Math.max(0,dy)*1.8);
 const excess=anchorX===undefined?0:Math.max(0,(radius-anchor)/Math.max(.1,anchor));
 const swivel=excess>0&&back>0?-Math.sign(dx)*Math.atan(excess*excess)*180/Math.PI*.8*back:0;
 return {x:dx/(depth*.55),back,swivel,down:down/(1+dx*dx*.12)};
}
