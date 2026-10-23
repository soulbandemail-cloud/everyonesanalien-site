/** Independent eyelid clock; seconds, with no React updates or extra render loop. */
export function createBlink(random:()=>number=Math.random){
 let wait=7+random()*6,elapsed=-1,second=false;
 const smooth=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
 return {tick(dt:number){
  dt=Math.max(0,dt);
  if(elapsed<0){wait-=dt;if(wait>0)return 0;elapsed=-wait;second=random()<.16;}
  else elapsed+=dt;
  const duration=.18,gap=.12;
  if(elapsed>=duration){
   if(second&&elapsed<duration+gap)return 0;
   if(second){elapsed-=duration+gap;second=false;}
   else {elapsed=-1;wait=7+random()*6;return 0;}
  }
  return elapsed<.055?smooth(elapsed/.055):1-smooth((elapsed-.055)/.125);
 }};
}
