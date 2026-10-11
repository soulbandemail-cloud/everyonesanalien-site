import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const mod={exports:{}};
new Function('module','exports',ts.transpileModule(fs.readFileSync('lib/ship/charlieAmbient.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(mod,mod.exports);
const {createAmbient}=mod.exports;
function advance(clock,seconds,mode='pilot',input=false,reduced=false){let pose;for(let i=0;i<seconds*60;i++)pose=clock.tick(1/60,mode,input,reduced);return pose;}
test('ambient events are rare, have smooth envelopes, and do not repeat consecutively',()=>{
 const clock=createAmbient(()=>0);
 assert.equal(advance(clock,17),undefined);
 const start=advance(clock,1.1);assert.equal(start.kind,'look');assert.ok(start.amount<.1);
 const middle=advance(clock,1);assert.ok(middle.amount>.95);
 assert.equal(advance(clock,5),undefined);
 assert.equal(advance(clock,18),undefined);
 const next=advance(clock,4);assert.equal(next.kind,'scratch');
});
test('cursor activity exits gestures quickly and postpones autonomous control',()=>{
 const clock=createAmbient(()=>0);advance(clock,19.5);
 const fading=advance(clock,.1,'pilot',true);assert.ok(fading.amount>0&&fading.amount<1);
 assert.equal(advance(clock,.15,'pilot',true),undefined);
 assert.equal(advance(clock,15),undefined);
});
test('commands, reading and reduced motion suppress the pose layer immediately',()=>{
 for(const reduced of [false,true]){
  const clock=createAmbient(()=>0);advance(clock,19.5);
  assert.equal(clock.tick(1/60,reduced?'pilot':undefined,false,reduced),undefined);
  assert.equal(advance(clock,15),undefined);
 }
});
test('standing never receives a seated stretch and timing is frame-rate independent',()=>{
 const a=createAmbient(()=>.9),b=createAmbient(()=>.9);
 let x,y;
 for(let i=0;i<37*60;i++)x=a.tick(1/60,'standing',false,false);
 for(let i=0;i<37*30;i++)y=b.tick(1/30,'standing',false,false);
 assert.equal(x.kind,'scratch');assert.equal(y.kind,x.kind);assert.ok(Math.abs(x.amount-y.amount)<.04);
});
