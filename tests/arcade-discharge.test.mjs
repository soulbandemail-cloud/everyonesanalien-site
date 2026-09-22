import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const code=ts.transpileModule(fs.readFileSync('components/arcade/discharge.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const loaded={exports:{}};new Function('module','exports',code)(loaded,loaded.exports);
const {Discharge,TAU,FULL_CHARGE_HEAD_WIDTHS,BOLT_LENGTH_FACTOR,pathLength,hitBolt,renderedOrbitAngle}=loaded.exports;
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);

test('angular distance supplies 20% per turn, partial turns accumulate, stops preserve charge, five turns overload once',()=>{
 const e=new Discharge(),orbit={};
 assert.equal(e.sampleOrbit(null,null),false);assert.equal(e.charge,0);
 e.sampleOrbit(orbit,TAU/4);close(e.charge,.05);
 e.sampleOrbit(orbit,TAU);close(e.charge,.2);
 e.sampleOrbit(null,null);close(e.charge,.2);
 const resumed={};e.sampleOrbit(resumed,3.75*TAU);close(e.charge,.95);
 assert.equal(e.sampleOrbit(resumed,4*TAU),true);assert.equal(e.charge,0);
 assert.equal(e.sampleOrbit(resumed,20*TAU),false);assert.equal(e.charge,0);
 e.sampleOrbit(null,null);const restarted={};e.sampleOrbit(restarted,TAU);close(e.charge,.2);
 assert.equal(e.sampleOrbit(restarted,5*TAU),true);assert.equal(e.charge,0);
});
test('charge uses rendered ellipse angle and completed iterations, not a wall-clock duration',()=>{
 const anchor={left:10,top:20};
 for(const angle of [0,.3,Math.PI/2,Math.PI,TAU-.2]){
  const box={left:10+56+40*Math.cos(angle)-16,top:20+48+21*Math.sin(angle)-16,width:32,height:32};
  close(renderedOrbitAngle(4,angle/TAU,box,anchor),4*TAU+angle);
 }
});
test('zero energy cannot draw; 25% buys eight rendered widths, one width costs 3.125%, endpoints stay capped',()=>{
 for(const headWidth of [24,32,48]) {
  const e=new Discharge();assert.equal(e.begin(1,{x:10,y:20},headWidth),false);
  e.charge=.25;assert.equal(e.begin(1,{x:10,y:20},headWidth),true);assert.equal(e.charge,.25);
  e.aim(1,{x:10+headWidth/BOLT_LENGTH_FACTOR,y:20});e.draw(0);close(pathLength(e.drawing.points),headWidth);close(e.charge,.21875);
  e.aim(1,{x:2000,y:20});e.draw(0);close(pathLength(e.drawing.points),headWidth*8);close(e.charge,0);
  const end=e.drawing.points.at(-1);e.draw(60);assert.deepEqual(e.drawing.points.at(-1),end);assert.equal(e.charge,0);
 }
 close(FULL_CHARGE_HEAD_WIDTHS,32);
});
test('shortening never refunds charge; sustaining the bolt drains energy',()=>{
 const e=new Discharge();e.charge=.5;e.begin(1,{x:0,y:0},32);e.aim(1,{x:32/BOLT_LENGTH_FACTOR,y:0});e.draw(0);
 const before=e.charge, a=e.drawing.points[0],b=e.drawing.points.at(-1),middle=e.drawing.points[1];
 e.draw(60);close(pathLength(e.drawing.points),32);assert.deepEqual(e.drawing.points[0],a);assert.deepEqual(e.drawing.points.at(-1),b);assert.notDeepEqual(e.drawing.points[1],middle);close(e.charge,before-.045);
 e.aim(1,{x:1,y:0});e.draw(60);close(e.charge,before-.045);
 e.aim(1,{x:0,y:32/BOLT_LENGTH_FACTOR});e.draw(60);close(e.charge,before-.045);
 e.end();assert.equal(e.drawing,null);close(e.charge,before-.045);
});
test('held discharge cannot refill from orbit and dissipates without restarting until a new press',()=>{
 const e=new Discharge(), orbit={}; e.charge=.5;
 e.begin(1,{x:0,y:0},32);e.aim(1,{x:20,y:0});e.draw(0);
 const before=e.charge;
 assert.equal(e.sampleOrbit(orbit,5*TAU),false);close(e.charge,before);
 e.draw(1000);close(e.charge,0);assert.ok(e.drawing.points.length);
 e.draw(1120);assert.equal(e.drawing,null);
 e.sampleOrbit(orbit,6*TAU);close(e.charge,.2);
 e.aim(1,{x:500,y:0});e.draw(1200);assert.equal(e.drawing,null);
 assert.equal(e.begin(1,{x:0,y:0},32),true);
});
test('sustain drain is elapsed-time based regardless of frame rate',()=>{
 const run=steps=>{const e=new Discharge();e.charge=.9;e.begin(1,{x:0,y:0},32);e.aim(1,{x:20,y:0});e.draw(0);for(let i=1;i<=steps;i++)e.draw(400*i/steps);return e.charge;};
 close(run(1),run(40));
});
test('collision tests every live zigzag segment, including middle proximity and fast crossing; unrelated endpoint misses',()=>{
 const path=[{x:0,y:0},{x:30,y:20},{x:60,y:-20},{x:90,y:0}];
 assert.ok(hitBolt({x:45,y:-50},{x:45,y:50},path,2));
 assert.ok(hitBolt({x:15,y:11},{x:15,y:11},path,2));
 assert.equal(hitBolt({x:45,y:80},{x:45,y:85},path,10),null);
 assert.equal(hitBolt({x:0,y:0},{x:1,y:1},[],16),null);
});
