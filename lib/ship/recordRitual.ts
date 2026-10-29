import {RECORDS,crankPoint,recordSide,trackTone,type RecordSide,type AlbumId} from './records';
export type P=[number,number,number];
export type Sleeve={a:P;b:P;c:P};
export type Disc={album:AlbumId;centre:P;tilt:number;flip?:number};
export type GramophoneScene={sleeves:Record<AlbumId,Sleeve>;disc:Disc|null;loadedAlbum:AlbumId|null;loadedSide?:RecordSide|null;playing?:boolean;tone:number;lift:number;crank:number;hands:[P|null,P|null];reach?:[number,number];amount:number;phase:string};
export type RitualStep={name:string;duration:number;from:GramophoneScene;to:GramophoneScene;wind?:boolean};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const ease=(t:number)=>t*t*(3-2*t);
export const mixPoint=(a:P,b:P,t:number):P=>a.map((v,i)=>mix(v,b[i],t)) as P;
export const storage=(album:AlbumId):Sleeve=>{const x=album==='experiencing-the-role'?-1.28:-1.10;return {a:[x,1.02,.28],b:[x,1.02,-.34],c:[x+.25,.31,.28]};};
const held:Sleeve={a:[-.9,1.38,-.78],b:[-.15,1.38,-.78],c:[-.9,.68,-.80]};
export const displaySleeve:Sleeve={a:[.46,1.98,.08],b:[1.20,1.98,.08],c:[.46,1.28,-.24]};
const grip=(s:Sleeve):P=>mixPoint(s.a,s.c,.62);
// Hands are ordered left / right; null leaves that arm relaxed beside the body.
const home:[null,null]=[null,null];
const platter:P=[-.72,1.418,-.08];
const discHeld:P=[-.12,1.32,-.84];
// Lift around the fixed hinge, then swing around the vertical post.
export function tonearmPoint(p:readonly number[],tone:number,lift:number):P{
 const x=p[0]+.23,y=p[1]-1.51,z=p[2]-.19;
 const pitch=Math.max(-.02,lift/.11)*Math.PI/4;
 const raisedY=y*Math.cos(pitch)-z*Math.sin(pitch),raisedZ=y*Math.sin(pitch)+z*Math.cos(pitch),a=-tone;
 return [-.23+x*Math.cos(a)-raisedZ*Math.sin(a),1.51+raisedY,.19+raisedZ*Math.cos(a)+x*Math.sin(a)];
}
const needle=(tone:number,lift:number):P=>tonearmPoint([-.27,1.46,-.24],tone,lift);
export function restingGramophone():GramophoneScene{return {sleeves:{'experiencing-the-role':storage('experiencing-the-role'),'the-magic-if':storage('the-magic-if')},disc:null,loadedAlbum:null,loadedSide:null,tone:0,lift:0,crank:0,hands:home,amount:0,phase:'idle'};}
export function recordRitual(initial:GramophoneScene,album:AlbumId,index:number):RitualStep[]{
 const steps:RitualStep[]=[];let scene=structuredClone(initial);
 const add=(name:string,duration:number,patch:Partial<GramophoneScene>,wind=false)=>{const to={...scene,...patch,phase:name,amount:1};steps.push({name,duration,from:scene,to,wind});scene=to;};
 const sleeve=(id:AlbumId,pose:Sleeve)=>({...scene.sleeves,[id]:pose});
 const old=scene.loadedAlbum,side=recordSide(index,album);
 const flipping=old===album&&(scene.loadedSide??'A')!==side;
 if(old){
  add('reach-tonearm',.7,{hands:[home[0],needle(scene.tone,scene.lift)]});
  add('lift-tonearm',.55,{lift:.11,hands:[home[0],needle(scene.tone,.11)]});
  if(old!==album||flipping){
   add('rest-tonearm',.8,{tone:0,hands:[home[0],needle(0,.11)]});
   add('lower-to-rest',.55,{lift:0,hands:[home[0],needle(0,0)]});
  }
  if(old!==album){
   add('reach-displayed-sleeve',.4,{hands:[null,grip(displaySleeve)]});
   add('take-displayed-sleeve',.65,{sleeves:sleeve(old,held),hands:[null,grip(held)]});
   add('reach-record',.35,{hands:[[-.40,1.43,-.08],grip(held)]});
   add('return-record-to-sleeve',.8,{disc:{album:old,centre:[-.52,1.03,-.79],tilt:0,flip:scene.disc?.flip??0},loadedAlbum:null,loadedSide:null,hands:[[-.2,1.03,-.79],grip(held)]});
   add('record-in-sleeve',.1,{disc:null});
   add('store-old-sleeve',.8,{sleeves:sleeve(old,storage(old)),hands:[null,grip(storage(old))]});
   add('release-old-sleeve',.45,{hands:home});
  }
 }
 if(old!==album){
  add('reach-stored-sleeve',.8,{hands:[null,grip(storage(album))]});
  add('retrieve-sleeve',1.15,{sleeves:sleeve(album,held),hands:[null,grip(held)]});
  // Vinyl starts inside the sleeve and slides out continuously.
  add('grip-record',.3,{disc:{album,centre:[-.52,1.03,-.79],tilt:0},hands:[[-.20,1.03,-.79],grip(held)]});
  add('extract-record',1,{disc:{album,centre:discHeld,tilt:0},hands:[[discHeld[0]+.30,discHeld[1],discHeld[2]],grip(held)]});
  add('display-sleeve',1.1,{sleeves:sleeve(album,displaySleeve),hands:[scene.hands[0],grip(displaySleeve)]});
  add('place-record',1.2,{disc:{album,centre:platter,tilt:Math.PI/2,flip:side==='B'?Math.PI:0},loadedAlbum:album,loadedSide:side,hands:[[-.40,1.43,-.08],null]});
 }
 if(flipping){
  const flip=scene.disc?.flip??0;
  add('reach-record-to-flip',.4,{hands:[[-.40,1.43,-.08],null]});
  add('lift-record-to-flip',.7,{disc:{album,centre:discHeld,tilt:0,flip},loadedAlbum:null,loadedSide:null,hands:[[discHeld[0]+.30,discHeld[1],discHeld[2]],null]});
  add('flip-record',1,{disc:{album,centre:discHeld,tilt:0,flip:flip+Math.PI}});
  add('replace-flipped-record',.8,{disc:{album,centre:platter,tilt:Math.PI/2,flip:flip+Math.PI},loadedAlbum:album,loadedSide:side,hands:[[-.40,1.43,-.08],null]});
 }
 const knob=crankPoint(.15,-.08,-.20) as P;
 add('reach-crank',.7,{hands:[home[0],knob]});
 add('wind-crank',2.4,{crank:Math.PI*6,hands:[home[0],knob]},true);
 add('release-crank',.45,{crank:0,hands:home});
 add('reach-tonearm',.65,{hands:[home[0],needle(scene.tone,scene.lift)]});
 add('raise-tonearm',.55,{lift:.11,hands:[home[0],needle(scene.tone,.11)]});
 const angle=trackTone({album,index});
 add('position-tonearm',.28,{tone:angle,hands:[home[0],needle(angle,.11)]});
 add('lower-tonearm',1,{lift:-.002,hands:[home[0],needle(angle,-.002)]});
 add('settle',.7,{hands:home});
 return steps;
}
/** Stop without touching the loaded record, sleeve or crank. */
export function stopRecordRitual(initial:GramophoneScene):RitualStep[]{
 const steps:RitualStep[]=[];let scene=structuredClone(initial);
 const add=(name:string,duration:number,patch:Partial<GramophoneScene>)=>{const to={...scene,...patch,phase:name,amount:1};steps.push({name,duration,from:scene,to});scene=to;};
 add('reach-tonearm',.7,{hands:[null,needle(scene.tone,scene.lift)]});
 add('lift-tonearm',.55,{lift:.11,hands:[null,needle(scene.tone,.11)]});
 add('rest-tonearm',.8,{tone:0,hands:[null,needle(0,.11)]});
 add('lower-to-rest',.55,{lift:0,hands:[null,needle(0,0)]});
 add('settle',.7,{hands:home});
 return steps;
}
export function ritualFrame(steps:RitualStep[],elapsed:number):{scene:GramophoneScene;done:boolean}{
 let time=elapsed;
 for(const step of steps){
  if(time>step.duration){time-=step.duration;continue;}
  const t=Math.min(1,time/step.duration),u=ease(t),a=step.from,b=step.to;
  const sleeves={} as GramophoneScene['sleeves'];
  for(const album of RECORDS){const from=a.sleeves[album.id],to=b.sleeves[album.id];sleeves[album.id]={a:mixPoint(from.a,to.a,u),b:mixPoint(from.b,to.b,u),c:mixPoint(from.c,to.c,u)};}
  const disc=a.disc&&b.disc?{album:b.disc.album,centre:mixPoint(a.disc.centre,b.disc.centre,u),tilt:mix(a.disc.tilt,b.disc.tilt,u),flip:mix(a.disc.flip??0,b.disc.flip??0,u)}:b.disc??(t<1?a.disc:null);
  const crank=step.wind ? Math.PI*6*(u+Math.sin(u*Math.PI*6)*.012) : 0;
  const hands=([0,1] as const).map(i=>a.hands[i]&&b.hands[i]?mixPoint(a.hands[i]!,b.hands[i]!,u):b.hands[i]??a.hands[i]) as GramophoneScene['hands'];
  const reach=([0,1] as const).map(i=>mix(a.hands[i]?1:0,b.hands[i]?1:0,u)) as [number,number];
  if(step.wind)hands[1]=crankPoint(.15,-.08,-.20,crank) as P;
  const tone=mix(a.tone,b.tone,u),lift=mix(a.lift,b.lift,u);
  if(['lift-tonearm','rest-tonearm','lower-to-rest','raise-tonearm','position-tonearm','lower-tonearm'].includes(step.name))hands[1]=needle(tone,lift);
  return {done:false,scene:{...b,sleeves,disc,loadedAlbum:t===1?b.loadedAlbum:a.loadedAlbum,loadedSide:t===1?b.loadedSide:a.loadedSide,tone:mix(a.tone,b.tone,u),lift:mix(a.lift,b.lift,u),crank,hands,reach,amount:step.name==='settle'?1-u:mix(a.amount,1,u),phase:step.name}};
 }
 const scene=steps.at(-1)?.to??restingGramophone();return {done:true,scene:{...scene,crank:0,amount:0,phase:'idle'}};
}
