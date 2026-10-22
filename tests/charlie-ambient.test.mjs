import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const mod={exports:{}};
new Function('module','exports',ts.transpileModule(fs.readFileSync('lib/ship/charlieAmbient.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(mod,mod.exports);
const {createAmbient,ambientJoints}=mod.exports;
function advance(clock,seconds,mode='pilot',input=false,reduced=false){let pose;for(let i=0;i<seconds*60;i++)pose=clock.tick(1/60,mode,input,reduced);return pose;}
test('idle frequency increases by 50%, while gestures never overlap or repeat',()=>{
 const clock=createAmbient(()=>0);assert.equal(advance(clock,11),undefined);
 const start=advance(clock,1.1);assert.equal(start.kind,'look');assert.ok(start.amount<.1);
 const seen=[];let previous;
 for(let i=0;i<200*60;i++){const p=clock.tick(1/60,'pilot',false,false);if(p&&p.kind!==previous){seen.push(p.kind);previous=p.kind;}}
 assert.ok(seen.length>5);assert.ok(seen.every((v,i)=>!i||v!==seen[i-1]));
});
test('commands smoothly cancel active gestures and leave no residual pose',()=>{
 const clock=createAmbient(()=>0);advance(clock,13.5);
 const fading=advance(clock,.1,undefined,true);assert.ok(fading.amount>0&&fading.amount<1);
 assert.equal(advance(clock,.2,undefined,true),undefined);assert.equal(advance(clock,10),undefined);
});
test('reduced motion suppresses gestures and standing stretch cannot trigger seated',()=>{
 const clock=createAmbient(()=>.99);assert.equal(advance(clock,100,'pilot',false,true),undefined);
 for(const mode of ['pilot','standing']){
  const c=createAmbient(()=>.99);const seen=new Set();for(let i=0;i<300*60;i++){const p=c.tick(1/60,mode,false,false);if(p)seen.add(p.kind);}
  if(mode==='pilot'){assert.ok(!seen.has('fullStretch'));assert.ok(seen.has('stretch'));}
  else {assert.ok(seen.has('fullStretch'));assert.ok(!seen.has('stretch'));assert.ok(!seen.has('recline'));}
 }
});
test('ambient timing agrees at 30 and 60fps',()=>{
 const a=createAmbient(()=>.9),b=createAmbient(()=>.9);let x,y;
 for(let i=0;i<25*60;i++)x=a.tick(1/60,'standing',false,false);
 for(let i=0;i<25*30;i++)y=b.tick(1/30,'standing',false,false);
 assert.equal(x.kind,y.kind);assert.ok(Math.abs(x.amount-y.amount)<.04);
});
test('scratch has four visible contact strokes and a quiet thoughtful pause',()=>{
 const p=time=>ambientJoints({kind:'scratch',amount:1,time,side:1}).rub;
 assert.ok(p(1.375)>4.9);assert.ok(p(1.625)<-4.9);assert.ok(p(2.875)>4.9);assert.equal(p(3.5),0);
});
test('glances hold their direction, reverse only in the two-sided variant, and retain bounded pitch',()=>{
 const p=(time,variant)=>ambientJoints({kind:'look',amount:1,time,side:1,variant});
 assert.equal(p(1.5,0).headYaw,p(3.5,0).headYaw);
 assert.ok(p(1.5,2).headYaw>0&&p(3.5,2).headYaw<0);
 assert.equal(p(2,3).headYaw,0);assert.ok(Math.abs(p(2,3).headPitch)<.2);
 assert.ok(Math.abs(p(.6,0).torsoYaw)<Math.abs(p(.6,0).headYaw));
});
