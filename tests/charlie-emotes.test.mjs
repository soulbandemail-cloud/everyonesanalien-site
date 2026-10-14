import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const loaded={exports:{}};
new Function('module','exports',ts.transpileModule(fs.readFileSync('lib/ship/charlieEmotes.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(loaded,loaded.exports);
const {EMOTES,emotePose,neutralEmote,canEmote,emoteWheelLayout}=loaded.exports;
test('clock positions and standing eligibility preserve interaction exclusions',()=>{
 assert.deepEqual(EMOTES.map(e=>e.id),['idea','wave','peace','love','kiss','dance-1','dance-2','dance-3','guitar','laugh','confused','sleepy']);
 const state={mode:'standing',phase:null,engagement:null,moving:0};
 assert.equal(canEmote(state,false),true);
 for(const patch of [{mode:'walking'},{mode:'pilot-seated'},{mode:'sofa-seated'},{phase:'rising'},{engagement:'records'},{moving:.2}])assert.equal(canEmote({...state,...patch},false),false);
 assert.equal(canEmote(state,true),false);
});
test('wave raises left immediately, alternates left/right and settles together at two seconds',()=>{
 const command={kind:'wave',started:0,from:neutralEmote};
 const early=emotePose(command,100);assert.ok(early.raise>0);assert.ok(early.sweep<0);assert.ok(early.lean>0);
 for(const [t,sign] of [[400,-1],[400+1100/3,1],[400+2200/3,-1],[1500,1]])assert.ok(emotePose(command,t).sweep*sign>.99);
 const ending=emotePose(command,1750);assert.ok(ending.raise>0&&ending.raise<1);assert.ok(Math.abs(ending.lean)<.17);
 assert.deepEqual(emotePose(command,2000),neutralEmote);
 const pose=emotePose(command,700),cancel={kind:'recover',started:700,from:pose};
 assert.deepEqual(emotePose(cancel,700),pose);assert.deepEqual(emotePose(cancel,920),neutralEmote);
});
test('wheel uses a uniform radius, safe viewport bounds and touch-sized targets',()=>{
 for(const [width,height,scale] of [[1280,720,1],[844,390,1],[1200,550,.7]])for(const [x,y] of [[width/2,height/2],[20,30],[width-20,height-30]]){
  const l=emoteWheelLayout(x,y,width,height,scale);assert.ok(l.button*scale>=32);
  for(let i=0;i<12;i++){const a=i*Math.PI/6,px=l.x+Math.sin(a)*l.radius,py=l.y-Math.cos(a)*l.radius;assert.ok(px-l.button/2>=0&&px+l.button/2<=width);assert.ok(py-l.button/2>=0&&py+l.button/2<=height);}
  if(x===width/2){assert.equal(l.x,x);assert.equal(l.y,y);}
 }
});
test('wave keeps feet planted, supports the tee, and returns to identical neutral geometry',()=>{
 const m={exports:{}};new Function('module','exports','require',ts.transpileModule(fs.readFileSync('lib/ship/alienVolume.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m,m.exports,()=>loaded.exports);
 const {alienVolume}=m.exports;
 const feet=mesh=>mesh.flatMap(f=>[...f.d.matchAll(/(-?\d+\.\d+),(-?\d+\.\d+)/g)].map(m=>[+m[1],+m[2]]).filter(p=>p[1]>225)).sort().map(p=>p.join(',')).join('|');
 for(const outfit of [null,'soul-ringer-1']){
  const base=alienVolume(180,0,true,{stand:1,outfit});
  for(const t of [200,400,800,1500]){const mesh=alienVolume(180,0,true,{stand:1,outfit,emote:emotePose({kind:'wave',started:0,from:neutralEmote},t)});assert.equal(feet(mesh),feet(base));assert.ok(mesh.every(f=>! /NaN|Infinity/.test(f.d)));if(outfit)assert.ok(mesh.some(f=>f.texture));}
  assert.deepEqual(alienVolume(180,0,true,{stand:1,outfit,emote:neutralEmote}),base);
 }
});
test('all one-shots settle and all four performances continue without time limits',()=>{
 const {EMOTE_DURATIONS,loopingEmote}=loaded.exports;
 for(const {id} of EMOTES){
  const c={kind:id,started:0,from:neutralEmote},duration=EMOTE_DURATIONS[id]*1000;
  assert.ok(emotePose(c,600).raise>0,id);
  if(loopingEmote(id)){
   assert.ok(emotePose(c,3600000).raise>0,id);
   const a=emotePose(c,duration*3-0.01),b=emotePose(c,duration*3+0.01);
   for(const k of ['lean','bodyY','hipX','stepL','stepR','liftL','liftR'])assert.ok(Math.abs(a[k]-b[k])<.01,`${id} ${k} seam`);
  }else assert.deepEqual(emotePose(c,duration+1),neutralEmote,id);
 }
});
test('wave holds one left lean, gestures use distinct hands and love never emits bubbles',()=>{
 for(let t=400;t<1500;t+=50){const p=emotePose({kind:'wave',started:0,from:neutralEmote},t);assert.ok(p.lean>.16&&p.lean<.20);}
 const pose=id=>emotePose({kind:id,started:0,from:neutralEmote},1100);
 assert.ok(pose('peace').arms.every(a=>a.peace===1));
 assert.ok(pose('love').arms.every(a=>a.heart===1));assert.equal(pose('love').kiss,0);
 assert.equal(pose('idea').arms[1].index,1);assert.equal(pose('idea').bulb,1);
 assert.equal(pose('guitar').guitar,1);
});
test('all emotes produce finite clothed and unclothed geometry through their transitions',()=>{
 const m={exports:{}};new Function('module','exports','require',ts.transpileModule(fs.readFileSync('lib/ship/alienVolume.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m,m.exports,()=>loaded.exports);
 for(const {id} of EMOTES)for(const outfit of [null,'soul-ringer-1'])for(const t of [150,650,1400,2200]){
  const p=emotePose({kind:id,started:0,from:neutralEmote},t);
  const mesh=m.exports.alienVolume(180,0,true,{stand:1,outfit,emote:p});
  assert.ok(mesh.every(f=>! /NaN|Infinity/.test(f.d)),`${id} ${t}`);
 }
});
