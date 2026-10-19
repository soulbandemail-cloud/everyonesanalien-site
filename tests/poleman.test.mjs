import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const module={exports:{}};new Function('module','exports',ts.transpileModule(fs.readFileSync('components/arcade/polemanBattle.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(module,module.exports);
const {createBattle,stepBattle,head,canEnter,enterOpening,blades,attackTiming}=module.exports;
const run=(s,seconds,held=false)=>{for(let i=0;i<seconds*120;i++)stepBattle(s,1/120,held);};
test('intro enters a readable attack and recovery; beam is forbidden during attack and stun',()=>{const s=createBattle();run(s,5.1,true);assert.equal(s.phase,'attack');assert.equal(s.beam,false);while(s.phase==='attack'){s.invincible=10;stepBattle(s,1/120,true);assert.equal(s.beam,false);}assert.equal(s.phase,'recovery');s.phase='stun';stepBattle(s,1/120,true);assert.equal(s.beam,false);});
test('activation without geometric contact does not pull the head',()=>{const s=createBattle();s.phase='recovery';s.ufo=s.target={x:30,y:100};run(s,2,true);assert.equal(s.extension,0);assert.equal(s.contact,false);});
test('sustained intersecting diagonal beam pulls a heavy head to stun',()=>{const s=createBattle();s.phase='recovery';for(let i=0;i<800&&s.phase!=='stun';i++){const p=head(s);s.target={x:p.x-80,y:p.y+60};s.ufo={...s.target};stepBattle(s,1/120,true);}assert.equal(s.phase,'stun');assert.ok(s.headX<0);assert.equal(s.beam,false);});
test('desktop entry requires clicking the stunned opening; mobile accepts crossing from either side',()=>{
 const s=createBattle();s.headX=69;s.extension=.6;const p=head(s);
 assert.equal(enterOpening(s,p),false);s.phase='stun';
 assert.equal(enterOpening(s,{x:p.x+100,y:p.y}),false);
 s.ufo=s.target={...p};stepBattle(s,1/120,false);assert.equal(s.phase,'stun');
 assert.equal(enterOpening(s,head(s)),true);assert.equal(s.phase,'entry');
 for(const side of [-1,1]){const m=createBattle();m.phase='stun';m.headX=69;m.extension=.6;m.flyOverEntry=true;const q=head(m);m.ufo={x:q.x+side*10,y:q.y};m.target={...q};stepBattle(m,1/120,false);assert.equal(m.phase,'entry');}
});
test('a successful incursion removes one third exactly and third hit wins',()=>{for(let hits=0;hits<3;hits++){const s=createBattle();s.hits=hits;s.phase='entry';run(s,.6);assert.equal(s.hits,hits+1);assert.equal(s.phase,'damage');run(s,2);assert.equal(s.phase,hits===2?'victory':'attack');}});
test('missing stun is harmless, and health loss and trace drain progressively',()=>{const s=createBattle();s.phase='stun';run(s,4.1);assert.equal(s.hp,5);assert.equal(s.phase,'attack');s.hp=4;stepBattle(s,1/120,false);assert.ok(s.health<1&&s.health>.8);assert.ok(s.trace>s.health);});
test('blade contact damages once inside invulnerability and zero health enters defeat',()=>{const s=createBattle();s.phase='attack';s.combo=['left-sweep','right-sweep','double-sweep'];s.time=.43;const b=blades(s)[0];s.ufo=s.target={x:(b.a.x+b.b.x)/2,y:(b.a.y+b.b.y)/2};stepBattle(s,1/120,false);assert.equal(s.hp,4);stepBattle(s,1/120,false);assert.equal(s.hp,4);s.hp=1;s.invincible=0;const next=blades(s)[0];s.ufo=s.target={x:(next.a.x+next.b.x)/2,y:(next.a.y+next.b.y)/2};stepBattle(s,1/120,false);assert.equal(s.phase,'defeat');});
test('three successive pull and click-entry sequences complete the battle',()=>{
 const s=createBattle();s.nextShot=Infinity;
 for(let i=0;i<120*120&&s.phase!=='victory'&&s.phase!=='defeat';i++){
  const tip=head(s);let held=false;
  if(s.phase==='recovery'||s.phase==='pulling'){held=true;s.target={x:tip.x-80,y:tip.y+60};}
  else if(s.phase==='stun'){enterOpening(s,tip);}
  else s.target={x:500,y:s.h*.78};
  s.invincible=10;stepBattle(s,1/120,held);
 }
 assert.equal(s.phase,'victory');assert.equal(s.hits,3);
});

test('upward diagonal pulling works symmetrically on both sides',()=>{
 for(const side of [-1,1]){const s=createBattle();s.phase='recovery';s.nextShot=Infinity;
 for(let i=0;i<600&&s.phase!=='stun';i++){const p=head(s);s.target={x:p.x+side*80,y:p.y+60};s.ufo={...s.target};stepBattle(s,1/120,true);if(s.contact)assert.ok(s.lean*side<0);}
 assert.equal(s.phase,'stun');assert.equal(Math.sign(s.headX),side);assert.ok(Math.abs(s.headX)<75);}
});
test('projectiles remove one fifth health and respect shared invulnerability',()=>{
 const s=createBattle();s.phase='recovery';s.ufo=s.target={x:300,y:400};s.nextShot=Infinity;
 s.skulls=[{x:300,y:400,vx:0,vy:0,black:false,age:0},{x:300,y:400,vx:0,vy:0,black:true,age:0}];
 stepBattle(s,1/120,false);assert.equal(s.hp,4);assert.equal(s.skulls.length,0);
});
test('both windmills cover a full rotation and are dangerous only during strikes',()=>{
 for(const move of ['left-windmill','right-windmill']){const s=createBattle();s.phase='attack';s.combo=[move];const index=move.startsWith('left')?0:1;
 s.time=.7;assert.equal(blades(s)[index].active,false);
 const directions=new Set();for(let t=1.4;t<3.9;t+=.05){s.time=t;const b=blades(s)[index];assert.equal(b.active,true);directions.add(Math.floor((Math.atan2(b.b.y-b.a.y,b.b.x-b.a.x)+Math.PI)/(Math.PI/2))%4);}
 assert.equal(directions.size,4);s.time=4;assert.equal(blades(s)[index].active,false);}
});

test('black skull turns back toward the player without instant or perfect tracking',()=>{
 const s=createBattle();s.phase='recovery';s.nextShot=Infinity;s.ufo=s.target={x:650,y:500};
 s.skulls=[{x:500,y:180,vx:0,vy:-72,black:true,age:.31}];
 stepBattle(s,1/120,false);assert.ok(s.skulls[0].vx>0);assert.ok(s.skulls[0].vy<0);
 run(s,1.5);assert.equal(s.skulls.length,1);assert.ok(s.skulls[0].vy>0);assert.ok(s.skulls[0].vx>0);
 assert.ok(Math.abs(Math.hypot(s.skulls[0].vx,s.skulls[0].vy)-72)<.001);
});

test('stun pauses skull firing, but existing skulls continue moving',()=>{
 const s=createBattle();s.phase='stun';s.nextShot=0;s.ufo=s.target={x:50,y:600};
 s.skulls=[{x:900,y:500,vx:30,vy:0,black:false,age:0}];run(s,1);
 assert.equal(s.skulls.length,1);assert.ok(s.skulls[0].x>920);assert.equal(s.nextShot,0);
});
test('damaging blades destroy either skull type before they reach the UFO',()=>{
 for(const black of [true,false]){const s=createBattle();s.phase='attack';s.combo=['left-sweep'];s.time=.43;s.nextShot=Infinity;s.ufo=s.target={x:900,y:500};
 const b=blades(s)[0];s.skulls=[{x:(b.a.x+b.b.x)/2,y:(b.a.y+b.b.y)/2,vx:0,vy:0,black,age:0}];
 stepBattle(s,1/120,false);assert.equal(s.skulls.length,0);assert.equal(s.hp,5);}
});
test('mirrored wipes rotate a half turn and slowly return to the same resting geometry',()=>{
 for(const move of ['left-wipe','right-wipe']){const s=createBattle();s.phase='attack';s.combo=[move];const i=move.startsWith('left')?0:1;
 const rest=blades(s)[i];const t=attackTiming(move);s.time=t.windup+t.strike;const far=blades(s)[i];
 assert.ok((rest.b.x-rest.a.x)*(far.b.x-far.a.x)+(rest.b.y-rest.a.y)*(far.b.y-far.a.y)<0);
 s.time=t.windup+t.strike+t.settle;const end=blades(s)[i];assert.ok(Math.hypot(end.b.x-rest.b.x,end.b.y-rest.b.y)<.001);assert.ok(t.settle>t.strike);}
});
test('intro arrives off centre following a curved path',()=>{
 const s=createBattle();run(s,2.5);assert.ok(Math.abs(s.ufo.x-500)>50);run(s,2.6);assert.equal(s.phase,'attack');assert.ok(Math.abs(s.ufo.x-590)<.01);
});
