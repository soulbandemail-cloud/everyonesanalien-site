/** An occasional pose layer only: never owns Charlie's destination or locomotion. */
export type AmbientKind='look'|'scratch'|'stretch'|'shift'|'recline'|'fullStretch';
export type AmbientPose={kind:AmbientKind;amount:number;time:number;side:number;variant?:number};
const smooth=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
export function ambientJoints(p?:AmbientPose){
 const t=p?.time??0,a=p?.amount??0,side=p?.side??1,variant=p?.variant??0;
 // A glance leads with the head, pauses, and only then changes direction.
 const turn=smooth((t-.15)/.65)*(variant===2?1-2*smooth((t-2.5)/.7):1);
 const follow=smooth((t-.4)/.9)*(variant===2?1-2*smooth((t-2.8)/.85):1);
 const looking=p?.kind==='look',full=p?.kind==='fullStretch';
 const scratch=p?.kind==='scratch';
 const strokes=t>=1.25&&t<=3.25?Math.sin((t-1.25)*Math.PI*4):0;
 const extension=full?a*smooth((t-.25)/1.25):0;
 return {
  headYaw:looking&&variant<3?side*.5*turn*a:0,
  headPitch:looking?(variant===3?-.18:variant===4?.13:0)*a:scratch?-.025*a:full?-.06*extension:0,
  torsoYaw:looking&&variant<3?side*.1*follow*a:0,
  lean:p?.kind==='shift'?side*.035*a:0,
  recline:p?.kind==='recline'?.075*a:0,
  extension,
  rub:scratch?strokes*5:0,
  antenna:a*(looking?.9*side*(turn-follow):full?Math.sin(Math.max(0,t-.25)*1.7)*.65:Math.sin(t*2-.5)*.45),
 };
}
export function createAmbient(random:()=>number=Math.random){
 let next=(18+random()*18)/1.5,elapsed=0,active:AmbientKind|null=null,last:AmbientKind|null=null,side=1,variant=0,exit=0;
 let activeMode:'pilot'|'standing'|undefined;
 const duration={look:5.4,scratch:4.6,stretch:5.6,shift:4.5,recline:5.8,fullStretch:6.8};
 const reset=()=>{active=null;activeMode=undefined;elapsed=0;exit=0;next=(22+random()*30)/1.5;};
 return {
  tick(dt:number,mode:'pilot'|'standing'|undefined,interrupted:boolean,reduced:boolean):AmbientPose|undefined {
   if(reduced){reset();return;}
   dt=Math.max(0,Math.min(dt,.05));
   // Keep a short outgoing pose, rather than snapping limbs on a new command.
   const cancel=interrupted||!mode||(activeMode!==undefined&&mode!==activeMode);
   if(cancel||exit>0){if(active)exit+=dt;else {next=(22+random()*30)/1.5;return;}}
   if(!active){
    next-=dt;if(next>0)return;
    const choices:AmbientKind[]=mode==='pilot'?['look','look','scratch','shift','recline','stretch']:['look','look','look','scratch','scratch','fullStretch'];
    const options=choices.filter(k=>k!==last);
    active=options[Math.min(options.length-1,Math.floor(random()*options.length))];
    activeMode=mode;last=active;side=random()<.5?-1:1;variant=Math.floor(random()*5);elapsed=0;exit=0;
   }
   elapsed+=dt;
   const entry=active==='fullStretch'?1.5:.9;
   const amount=smooth(elapsed/entry)*smooth((duration[active]-elapsed)/1.1)*(exit?1-smooth(exit/.28):1);
   if(elapsed>=duration[active]||exit>=.28){reset();return;}
   return {kind:active,amount,time:elapsed,side,variant};
  }
 };
}
