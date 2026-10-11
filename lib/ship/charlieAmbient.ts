/** An occasional pose layer only: never owns Charlie's destination or locomotion. */
export type AmbientKind='look'|'scratch'|'stretch';
export type AmbientPose={kind:AmbientKind;amount:number;time:number;side:number};
export function createAmbient(random:()=>number=Math.random){
 let next=18+random()*18,elapsed=0,active:AmbientKind|null=null,last:AmbientKind|null=null,side=1,exit=0;
 const duration={look:5.4,scratch:4.6,stretch:5.6};
 const reset=()=>{active=null;elapsed=0;exit=0;next=22+random()*30;};
 return {
  tick(dt:number,mode:'pilot'|'standing'|undefined,interrupted:boolean,reduced:boolean):AmbientPose|undefined {
   // Transitions, reading and deliberate interactions have absolute priority.
   if(!mode||reduced){reset();return;}
   dt=Math.max(0,Math.min(dt,.05));
   if(interrupted){if(active)exit+=dt;else next=22+random()*30;}
   if(!active){
    if(interrupted)return;
    next-=dt;if(next>0)return;
    const choices:AmbientKind[]=mode==='pilot'?['look','scratch','stretch']:['look','scratch'];
    const options=choices.filter(k=>k!==last);
    active=options[Math.min(options.length-1,Math.floor(random()*options.length))];
    last=active;side=random()<.5?-1:1;elapsed=0;exit=0;
   }
   elapsed+=dt;
   const smooth=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
   const amount=smooth(elapsed/.9)*smooth((duration[active]-elapsed)/1.1)*(exit?1-smooth(exit/.22):1);
   if(elapsed>=duration[active]||exit>=.22){reset();return;}
   return {kind:active,amount,time:elapsed,side};
  }
 };
}
