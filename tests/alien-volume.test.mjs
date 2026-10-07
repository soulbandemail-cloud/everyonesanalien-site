import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const loaded={exports:{}};
new Function('module','exports',ts.transpileModule(fs.readFileSync('lib/ship/alienVolume.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(loaded,loaded.exports);
const {alienVolume}=loaded.exports;
test('alien retains head volume at front, quarter, side and rear angles',()=>{
 for(const yaw of [0,45,90,135,180,225,270,315]){
  const mesh=alienVolume(yaw,0);
  const head=mesh.flatMap(f=>[...f.d.matchAll(/(-?\d+\.\d+),(-?\d+\.\d+)/g)].map(m=>({x:+m[1],y:+m[2]}))).filter(p=>p.y>40&&p.y<130);
  assert.ok(Math.max(...head.map(p=>p.x))-Math.min(...head.map(p=>p.x))>80);
  assert.ok(mesh.every(f=>! /NaN|Infinity/.test(f.d)));
  assert.ok(mesh.every((f,i)=>i===0||f.depth>=mesh[i-1].depth));
 }
});
test('head pitch stays finite across the full up/down nod range',()=>{
 for(const yaw of [0,90,180,270]) for(const down of [-1,-.5,0,.5,1]) assert.ok(alienVolume(yaw,down).every(f=>! /NaN|Infinity/.test(f.d)));
});

test('look direction uses opposite, continuous 3D turns for left and right',()=>{
 const {alienLookYaw}=loaded.exports;
 for(const back of [0,.25,.5,.75,1]){
  assert.ok(alienLookYaw(-.8,back)>0);
  assert.ok(alienLookYaw(.8,back)<0);
  assert.ok(Math.abs(alienLookYaw(-.8,back)+alienLookYaw(.8,back))<1e-8);
 }
 assert.equal(Math.abs(alienLookYaw(0,0)),0);
 for(const x of [-1,-.5,.5,1])for(let b=.001;b<=1;b+=.001)assert.ok(Math.abs(alienLookYaw(x,b)-alienLookYaw(x,b-.001))<1);
});

test('head nod is capped at both ends even with out-of-range input',()=>{
 for(const yaw of [0,90,180,270]){
  assert.deepEqual(alienVolume(yaw,-3),alienVolume(yaw,-1));
  assert.deepEqual(alienVolume(yaw,3),alienVolume(yaw,1));
 }
});
