/** Fixed-step boss simulation. Rendering, beam contact and blade collisions share geometry. */
export type V = {x:number;y:number};
export type Phase = 'intro'|'spiral'|'attack'|'recovery'|'pulling'|'stun'|'entry'|'damage'|'victory'|'defeat';
export type Move = 'spiral'|'left-sweep'|'right-sweep'|'double-sweep'|'left-windmill'|'right-windmill'|'left-wipe'|'right-wipe';
export type Blade = {joint:V;a:V;b:V;active:boolean};
export type Skull = V & {vx:number;vy:number;black:boolean;age:number;spiral?:number;sequence?:number};
export const STUN_EXTENSION = .6;
export const BEAM_LENGTH = 180;
export const UFO_RADIUS = 12.5;
export const MOVES:Move[] = ['left-sweep','right-sweep','double-sweep','left-windmill','right-windmill','left-wipe','right-wipe'];
export type Battle = {
 phase:Phase;time:number;clock:number;hits:number;hp:number;invincible:number;cycle:number;
 ufo:V;previous:V;target:V;headX:number;headV:number;extension:number;beam:boolean;contact:boolean;lean:number;
 health:number;trace:number;bossHealth:number;bossTrace:number;h:number;frozenBlades?:Blade[];
 headLower:number;mobile:boolean;spiralWait:number|null;spiralCount:number;spiralShot:number;spiralAngle:number;spiralOrigin?:V;
 flyOverEntry:boolean;entryFrom?:V;combo:Move[];comboIndex:number;seed:number;skulls:Skull[];nextShot:number;recoil:number;
};
export const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
export const smooth=(n:number)=>{n=clamp(n,0,1);return n*n*(3-2*n);};
function random(s:Battle){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
function chooseCombo(s:Battle){
 const pool=[...MOVES];s.combo=[];
 for(let i=0;i<6;i++)s.combo.push(pool.splice(Math.floor(random(s)*pool.length),1)[0]);
 if(s.hits===2&&(s.spiralWait===null||s.spiralWait<=0))s.combo[Math.floor(random(s)*6)]='spiral';
 s.comboIndex=0;
}
export function createBattle(h=700,seed=12345):Battle{
 const s:Battle={phase:'intro',time:0,clock:0,hits:0,hp:5,invincible:0,cycle:0,ufo:{x:500,y:h+60},previous:{x:500,y:h+60},target:{x:590,y:h*.77},headX:0,headV:0,extension:0,beam:false,contact:false,lean:0,health:1,trace:1,bossHealth:1,bossTrace:1,h,headLower:0,mobile:false,spiralWait:null,spiralCount:0,spiralShot:0,spiralAngle:0,flyOverEntry:false,combo:[],comboIndex:0,seed,skulls:[],nextShot:3,recoil:0};
 chooseCombo(s);return s;
}
export const shoulder=(s:Battle)=>({x:500,y:s.h*.5});
export function head(s:Battle){
 const o=shoulder(s),x=s.headX,y=-100+130*s.extension;
 const lower=s.headLower;
 // A rigid, fixed-length cuboid tilts down and advances in depth when pulled.
 const z=Math.sqrt(360*360-x*x-y*y)+180*s.extension;
 const perspective=1000/(1000-z),baseScale=1000/(1000-180*s.extension);
 const awakening=s.phase==='intro'?12*(1-smooth((s.time-1)/2)):0;
 return {x:o.x+x*perspective,y:o.y+(y+awakening-s.recoil*9)*perspective*(1-lower),r:14*perspective,scale:perspective,baseScale,z};
}
export function attackTiming(move:Move){
 if(move.endsWith('windmill'))return {windup:1.4,strike:2.5,settle:.35};
 if(move==='left-sweep'||move==='right-sweep')return {windup:.85,strike:.16,settle:.22};
 if(move.endsWith('wipe'))return {windup:.6,strike:1.1,settle:1.7};
 return {windup:.38,strike:.16,settle:.22};
}
export function blades(s:Battle):Blade[]{
 if(s.frozenBlades)return s.frozenBlades;
 const o=shoulder(s),t=s.time*(1+s.hits*.18),move=s.combo[s.comboIndex]??'left-sweep';
 const timing=attackTiming(move),strikeEnd=timing.windup+timing.strike;
 const reach=Math.max(430,Math.min(950,s.h*.4));
 return [-1,1].map((side,i)=>{
  const selected=move==='double-sweep'||move.startsWith(i===0?'left':'right');
  let angle=-.8,lift=0,inset=0;
  if(s.phase==='attack'&&selected){
   const wind=smooth(t/timing.windup),strike=smooth((t-timing.windup)/timing.strike),settle=smooth((t-strikeEnd)/timing.settle);
   if(move.endsWith('windmill')){
    // Mirroring X makes right clockwise and left anticlockwise. Telegraph down first.
    angle=-.8+1.5*wind+Math.PI*2*strike;
    angle+=(Math.PI*2-.8-angle)*settle;
    lift=-Math.sin(strike*Math.PI)*Math.min(180,s.h*.12);inset=80*Math.sin(strike*Math.PI);
   }else if(move.endsWith('wipe')){
    // Left screen arm dips anticlockwise, wipes clockwise, then slowly retraces.
    const dip=.22*Math.sin(Math.PI*wind);
    angle=-.8+dip-Math.PI*strike+Math.PI*settle;
   }else if(move==='double-sweep'){angle=-.8-.25*wind+2.3*strike-2.05*settle;lift=-45*wind*(1-strike);}
   else{angle=-.8-.45*wind+2.5*strike-2.05*settle;lift=-55*wind*(1-strike);}
  }
  if(s.phase==='damage')angle=1.35+Math.sin(s.time*35+i)*.07;
  // The extra shallow reflex joint follows the canopy's two-part upper arm.
  const joint={x:o.x+side*(112-inset*.35),y:o.y+22+lift*.4};
  const elbow={x:o.x+side*(210-inset),y:o.y+65+lift};
  return {joint,a:elbow,b:{x:elbow.x+side*Math.cos(angle)*reach,y:elbow.y+Math.sin(angle)*reach},active:selected&&s.phase==='attack'&&t>=timing.windup&&t<strikeEnd};
 });
}
export function distanceSegment(p:V,a:V,b:V){const x=b.x-a.x,y=b.y-a.y,t=clamp(((p.x-a.x)*x+(p.y-a.y)*y)/(x*x+y*y||1),0,1);return Math.hypot(p.x-a.x-t*x,p.y-a.y-t*y);}
export function canEnter(s:Battle,from:V,to:V){
 const tip=head(s),a=Math.sign(s.headX)*-.3,c=Math.cos(a),n=Math.sin(a);
 const local=(p:V)=>{const x=p.x-tip.x,y=p.y-tip.y;return {x:(x*c+y*n)/tip.r,y:(-x*n+y*c)/(tip.r*.7)};};
 return s.phase==='stun'&&s.extension>=STUN_EXTENSION-.001&&distanceSegment({x:0,y:0},local(from),local(to))<=1;
}
export function enterOpening(s:Battle,point:V){
 if(!canEnter(s,point,point))return false;
 s.entryFrom={...s.ufo};phase(s,'entry');return true;
}
/** Substeps cover the swept blade, so the fast chops cannot tunnel through targets. */
function bladeContact(point:V,before:Blade[],after:Blade[],radius:number){
 return after.some((b,i)=>{const a=before[i];if(!a.active&&!b.active)return false;
  for(let j=0;j<=8;j++){const t=j/8;if(distanceSegment(point,{x:a.a.x+(b.a.x-a.a.x)*t,y:a.a.y+(b.a.y-a.a.y)*t},{x:a.b.x+(b.b.x-a.b.x)*t,y:a.b.y+(b.b.y-a.b.y)*t})<radius)return true;}return false;});
}
function phase(s:Battle,p:Phase){
 if(p==='defeat'||p==='stun')s.frozenBlades=blades(s).map(b=>({...b,active:false}));else s.frozenBlades=undefined;
 s.phase=p;s.time=0;s.beam=false;s.contact=false;
 if(p==='entry'||p==='victory'||p==='defeat')s.skulls=[];
}
function nextCombo(s:Battle){s.cycle++;chooseCombo(s);phase(s,'attack');}
function advanceAttack(s:Battle){if(s.comboIndex<s.combo.length-1){s.comboIndex++;phase(s,'attack');}else phase(s,'recovery');}
function hurt(s:Battle){if(s.invincible>0)return;s.hp--;s.invincible=1.3;if(s.hp===0)phase(s,'defeat');}

function attractSkull(s:Battle,p:Skull,dt:number){
 if(!s.beam)return;
 const dx=p.x-s.ufo.x,dy=p.y-s.ufo.y,axis={x:Math.sin(s.lean),y:-Math.cos(s.lean)};
 const along=dx*axis.x+dy*axis.y,across=Math.abs(dx*axis.y-dy*axis.x),width=7.5+along*(37.5/BEAM_LENGTH);
 if(along<=0||along>=BEAM_LENGTH||across>=width+10)return;
 const weight=smooth((width+10-across)/15)*smooth((BEAM_LENGTH-along)/25),d=Math.hypot(dx,dy)||1;
 p.vx-=dx/d*150*weight*dt;p.vy-=dy/d*150*weight*dt;
 const speed=Math.hypot(p.vx,p.vy);if(speed>190){p.vx*=190/speed;p.vy*=190/speed;}
}

function projectiles(s:Battle,dt:number){
 if(!['attack','recovery','pulling','stun','spiral'].includes(s.phase))return;
 if(s.phase!=='stun'&&s.phase!=='spiral')s.nextShot-=dt;
 if(s.phase!=='stun'&&s.phase!=='spiral'&&s.nextShot<=0){
  const tip=head(s),black=s.hits>0&&random(s)<.17,dx=s.ufo.x-tip.x,dy=s.ufo.y-tip.y,d=Math.hypot(dx,dy)||1;
  s.skulls.push({x:tip.x,y:tip.y,vx:black?0:dx/d*80,vy:black?-108:dy/d*80,black,age:0});
  s.recoil=1;s.nextShot=.8+random(s)**2*9;
 }
 if(s.phase==='spiral'&&s.spiralOrigin){
  while(s.spiralShot<48&&s.time+1e-8>= .6+(s.spiralShot+1)/6){
   const angle=s.spiralAngle+s.spiralShot*Math.PI*2/24;
   s.skulls.push({...s.spiralOrigin,vx:Math.cos(angle)*132,vy:Math.sin(angle)*132,black:false,age:0,spiral:s.spiralCount,sequence:s.spiralShot++});
   s.recoil=.45;
  }
 }
 const oldPositions=new Map(s.skulls.map(p=>[p,{x:p.x,y:p.y}]));
 s.skulls=s.skulls.filter(p=>{
  const old={x:p.x,y:p.y};p.age+=dt;
  if(p.black&&p.age>.3){const current=Math.atan2(p.vy,p.vx),desired=Math.atan2(s.ufo.y-p.y,s.ufo.x-p.x);const turn=Math.atan2(Math.sin(desired-current),Math.cos(desired-current));const a=current+clamp(turn,-dt*1.5,dt*1.5);const speed=108+(Math.hypot(p.vx,p.vy)-108)*Math.exp(-dt*.8);p.vx=Math.cos(a)*speed;p.vy=Math.sin(a)*speed;}
  attractSkull(s,p,dt);
  p.x+=p.vx*dt;p.y+=p.vy*dt;
  if(distanceSegment({x:0,y:0},{x:old.x-s.previous.x,y:old.y-s.previous.y},{x:p.x-s.ufo.x,y:p.y-s.ufo.y})<UFO_RADIUS+10){hurt(s);return false;}
  return s.phase!=='defeat'&&(p.x>-30&&p.x<1030&&p.y>-30&&p.y<s.h+30);
 });
 // Relative swept paths prevent fast skulls passing through one another.
 const destroyed=new Set<Skull>();
 for(let i=0;i<s.skulls.length;i++)for(let j=i+1;j<s.skulls.length;j++){
  const a=s.skulls[i],b=s.skulls[j];if(destroyed.has(a)||destroyed.has(b))continue;
  const pa=oldPositions.get(a)!,pb=oldPositions.get(b)!;
  if(distanceSegment({x:0,y:0},{x:pa.x-pb.x,y:pa.y-pb.y},{x:a.x-b.x,y:a.y-b.y})<20){destroyed.add(a);destroyed.add(b);}
 }
 s.skulls=s.skulls.filter(p=>!destroyed.has(p));
}
export function stepBattle(s:Battle,dt:number,held:boolean){
 const previousBlades=blades(s);
 dt=clamp(dt,0,1/30);s.time+=dt;s.clock+=dt;s.invincible=Math.max(0,s.invincible-dt);s.recoil*=Math.exp(-dt*9);s.previous={...s.ufo};
 if(s.spiralWait!==null&&s.phase!=='spiral')s.spiralWait=Math.max(0,s.spiralWait-dt);
 if(s.phase==='attack'&&s.combo[s.comboIndex]==='spiral'){s.spiralOrigin={x:500,y:s.h/2};s.spiralAngle=random(s)*Math.PI*2;s.spiralShot=0;s.spiralCount++;phase(s,'spiral');}
 s.headLower=s.phase==='spiral'?smooth(s.time/.6):s.headLower*Math.exp(-dt*8);
 const terminal=s.phase==='victory'||s.phase==='defeat';
 if(s.phase==='intro'){
  const t=smooth((s.time-1.3)/3),arc=Math.sin(Math.PI*t);
  s.ufo={x:500+90*t+Math.sin(t*Math.PI*2)*160*arc,y:s.h+60+(s.h*.77-s.h-60)*t+Math.cos(t*Math.PI*2)*65*arc};
  if(s.time>5){s.target={...s.ufo};phase(s,'attack');}
 }
 else if(!terminal&&s.phase!=='entry'&&s.phase!=='damage'){const dx=s.target.x-s.ufo.x,dy=s.target.y-s.ufo.y,d=Math.hypot(dx,dy),run=Math.min(d,780*dt);if(d){s.ufo.x+=dx/d*run;s.ufo.y+=dy/d*run;}}
 const tip=head(s),dx=tip.x-s.ufo.x,dy=tip.y-s.ufo.y;
 s.beam=(s.phase==='recovery'||s.phase==='pulling')&&held;
 // Beam starts upward: left of the head aims at 2 o'clock, right aims at 10.
 // atan2(dx,-dy) avoids the old +/-pi discontinuity on the right-hand side.
 const side=dx<0?-1:1,desired=side*clamp(Math.abs(Math.atan2(dx,-dy)),.65,1.15);
 s.lean+=(desired-s.lean)*(1-Math.exp(-dt*14));
 const axis={x:Math.sin(s.lean),y:-Math.cos(s.lean)},along=dx*axis.x+dy*axis.y,across=Math.abs(dx*axis.y-dy*axis.x);
 s.contact=s.beam&&dy<-10&&Math.abs(dx)>20&&along>0&&along<BEAM_LENGTH&&across<9+along*.2+tip.r;
 if(s.phase==='recovery'||s.phase==='pulling'){
  s.phase=s.contact?'pulling':'recovery';
  if(s.contact)s.headV+=(Math.sign(s.ufo.x-500)*115-s.headX*.25)*dt;
  else s.headV-=s.headX*dt*1.5;
  s.headV*=Math.exp(-dt*1.4);s.headX=clamp(s.headX+s.headV*dt,-150,150);
  // Extension follows actual displacement: reversing first undoes the old pull.
  s.extension=clamp(Math.abs(s.headX)/115,0,STUN_EXTENSION);
  if(s.extension>=STUN_EXTENSION){phase(s,'stun');s.headV=0;}else if(s.time>7)nextCombo(s);
 }else if(s.phase==='stun'){if(s.flyOverEntry&&canEnter(s,s.previous,s.ufo)){s.entryFrom={...s.ufo};phase(s,'entry');}else if(s.time>4)nextCombo(s);}
 else if(s.phase==='entry'&&s.time>.45){s.hits++;phase(s,'damage');}
 else if(s.phase==='damage'&&s.time>1.7){if(s.hits===3)phase(s,'victory');else{s.ufo={x:590,y:s.h*.77};s.target={...s.ufo};nextCombo(s);}}
 else if(s.phase==='attack'){
  if(bladeContact(s.ufo,previousBlades,blades(s),UFO_RADIUS+6))hurt(s);
  const a=attackTiming(s.combo[s.comboIndex]);
  if(s.phase==='attack'&&s.time*(1+s.hits*.18)>a.windup+a.strike+a.settle){
   advanceAttack(s);
  }
 }
 projectiles(s,dt);
 if(s.phase==='spiral'&&s.time>=8.6){
  s.spiralWait=15+random(s)*20;advanceAttack(s);
 }
 if(s.phase==='defeat')s.skulls=[];
 if(s.phase==='entry'&&s.entryFrom){const tip=head(s),t=smooth(s.time/.28);s.ufo={x:s.entryFrom.x+(tip.x-s.entryFrom.x)*t,y:s.entryFrom.y+(tip.y-s.entryFrom.y)*t};}
 if(s.phase==='damage'&&s.time>.9){const tip=head(s),t=smooth((s.time-.9)/.8);s.ufo={x:tip.x+(590-tip.x)*t,y:tip.y+(s.h*.77-tip.y)*t};}
 if(s.phase==='attack'){s.extension*=Math.exp(-dt*3);s.headX*=Math.exp(-dt*3);s.headV=0;}
 s.health+=(s.hp/5-s.health)*(1-Math.exp(-dt*5));s.bossHealth+=(1-s.hits/3-s.bossHealth)*(1-Math.exp(-dt*3));
 s.trace+=(s.health-s.trace)*(1-Math.exp(-dt*1.2));s.bossTrace+=(s.bossHealth-s.bossTrace)*(1-Math.exp(-dt*.85));
}
