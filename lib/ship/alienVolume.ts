/** Small illustrated meshes in the pilot's existing 180 × 250 drawing space. */
type V = {x:number;y:number;z:number};
type Face = {points:V[];colour:string;eye?:boolean;head?:boolean};
const faces:Face[]=[];
const sphere=(centre:V,r:V,colour:string,rows=12,cols=24)=>{
 const point=(a:number,b:number)=>({x:centre.x+r.x*Math.sin(a)*Math.cos(b),y:centre.y+r.y*Math.cos(a),z:centre.z+r.z*Math.sin(a)*Math.sin(b)});
 for(let i=0;i<rows;i++)for(let j=0;j<cols;j++) faces.push({colour,points:[point(i*Math.PI/rows,j*2*Math.PI/cols),point((i+1)*Math.PI/rows,j*2*Math.PI/cols),point((i+1)*Math.PI/rows,(j+1)*2*Math.PI/cols),point(i*Math.PI/rows,(j+1)*2*Math.PI/cols)]});
};
// Rounded head has substantial front/back depth even at a quarter turn.
sphere({x:0,y:85,z:0},{x:56,y:56,z:43},'#79cfb2',20,40);
faces.forEach(face=>{face.head=true;});
sphere({x:0,y:171,z:2},{x:15,y:39,z:11},'#79cfb2');
const tube=(points:V[],radius:number,colour:string)=>{
 for(let i=0;i<points.length-1;i++){
  const a=points[i],b=points[i+1];
  const length=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z);
  const axis={x:(b.x-a.x)/length,y:(b.y-a.y)/length,z:(b.z-a.z)/length};
  const n=Math.hypot(axis.x,axis.y)||1;
  const u={x:axis.y/n,y:-axis.x/n,z:0};
  const v={x:-axis.z*u.y,y:axis.z*u.x,z:axis.x*u.y-axis.y*u.x};
  const ring=(p:V,t:number)=>({x:p.x+radius*(u.x*Math.cos(t)+v.x*Math.sin(t)),y:p.y+radius*(u.y*Math.cos(t)+v.y*Math.sin(t)),z:p.z+radius*v.z*Math.sin(t)});
  for(let j=0;j<10;j++){const t=j*Math.PI/5,q=(j+1)*Math.PI/5;faces.push({colour,points:[ring(a,t),ring(b,t),ring(b,q),ring(a,q)]});}
  sphere(a,{x:radius,y:radius,z:radius},colour,6,10);
  sphere(b,{x:radius,y:radius,z:radius},colour,6,10);
 }
};
// A short neck lifts the unchanged head clear of the chair back.
sphere({x:0,y:133,z:0},{x:6,y:13,z:6},'#79cfb2');
for(const side of [-1,1]){
 // Small shoulder bridges join the raised arms to the narrow upper torso.
 tube([{x:side*5,y:136,z:1},{x:side*9,y:136,z:.5},{x:side*12,y:138,z:0}],3.2,'#79cfb2');
 // Dropped shoulders, elbows beside the waist, forearms returning to the lap.
 const handY=side<0?198:196,handZ=side<0?-22:-25;
 tube([{x:side*12,y:138,z:0},{x:side*19,y:154,z:1},{x:side*25,y:181,z:-3},{x:side*22,y:191,z:-12},{x:side*13,y:handY,z:handZ}],2.8,'#7fffd4');
 sphere({x:side*13,y:handY+2,z:handZ},{x:4,y:5,z:3},'#7fffd4');
 // Seated thighs extend forward from the planted hips before shins drop.
 const kneeZ=side<0?-43:-40;
 tube([{x:side*10,y:202,z:2},{x:side*15,y:203,z:-21},{x:side*18,y:206,z:kneeZ},{x:side*19,y:223,z:kneeZ+1},{x:side*20,y:244,z:kneeZ+5}],3,'#78c7ab');
 sphere({x:side*20,y:245,z:kneeZ},{x:6,y:3,z:8},'#78c7ab');
 const headStart=faces.length;
 tube([{x:side*28,y:38,z:0},{x:side*35,y:24,z:0},{x:side*43,y:15,z:2}],1.8,'#7fffd4');
 sphere({x:side*43,y:15,z:2},{x:4.5,y:4.5,z:4.5},'#b6ffe5');
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

export function alienVolume(yaw:number,down:number){
 const angle=yaw*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle),pitch=Math.max(-1,Math.min(1,down))*45*Math.PI/180;
 const rotate=(p:V,head=false)=>{let {x,y,z}=p;if(head){const t=Math.max(0,Math.min(1,(y-92)/49));const taper=t*t*(3-2*t);x*=1-.28*taper;y+=7*taper;const dy=y-120;y=120+dy*Math.cos(pitch)-z*Math.sin(pitch);z=dy*Math.sin(pitch)+z*Math.cos(pitch);y-=26;}return {x:90+x*c+z*s,y,z:z*c-x*s};};
 return faces.filter(face=>{
  if(!face.eye)return true;
  const centre=face.points.reduce((v,p)=>({x:v.x+p.x/face.points.length,y:0,z:v.z+p.z/face.points.length}),{x:0,y:0,z:0});
  return centre.z/43**2*c-centre.x/56**2*s>0;
 }).map(face=>{
  const p=face.points.map(p=>rotate(p,face.head)).map(v=>({x:+v.x.toFixed(6),y:+v.y.toFixed(6),z:+v.z.toFixed(6)})),a=p[0],b=p[1],d=p[2];
  const nx=(b.y-a.y)*(d.z-a.z)-(b.z-a.z)*(d.y-a.y),ny=(b.z-a.z)*(d.x-a.x)-(b.x-a.x)*(d.z-a.z),nz=(b.x-a.x)*(d.y-a.y)-(b.y-a.y)*(d.x-a.x);
  const length=Math.hypot(nx,ny,nz)||1;
  const light=.83+.17*Math.max(0,(-nx*.3-ny*.5+nz*.8)/length);
  const rgb=face.colour.slice(1).match(/../g)!.map(v=>parseInt(v,16));
  return {d:`M${p.map(v=>`${v.x.toFixed(2)},${v.y.toFixed(2)}`).join('L')}Z`,depth:(face.eye?100:0)+(+(p.reduce((sum,v)=>sum+v.z,0)/p.length).toFixed(5)),fill:face.colour==='#000000'?'#000000':`rgb(${rgb.map((v,i)=>Math.round(v*light+(i===0?5:0))).join(',')})`};
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
