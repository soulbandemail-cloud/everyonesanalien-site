import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const loaded={exports:{}};
new Function('module','exports',ts.transpileModule(fs.readFileSync('lib/ship/pilotChairVolume.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(loaded,loaded.exports);
test('pilot chair has a high back and retains physical thickness throughout its swivel',()=>{
 for(const yaw of [0,45,90,135,180,225,270,315]){
  const mesh=loaded.exports.pilotChairVolume(yaw);
  assert.ok(mesh.every(f=>Number.isFinite(f.depth)&&! /NaN|Infinity/.test(f.d)));
  const points=mesh.flatMap(f=>[...f.d.matchAll(/(-?\d+\.\d+),(-?\d+\.\d+)/g)].map(m=>({x:+m[1],y:+m[2]})));
  assert.ok(Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x))>40);
  assert.equal(Math.min(...points.map(p=>p.y)),124);
  assert.ok(Math.max(...points.map(p=>p.y))<225);
 }
});
