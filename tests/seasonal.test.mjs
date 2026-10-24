import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const m={exports:{}};
new Function('module','exports',ts.transpileModule(fs.readFileSync('lib/ship/seasonal.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(m,m.exports);
const {HALLOWEEN,inSeason,untilLocalMidnight,savedSeasonalLight}=m.exports;
test('annual Halloween boundaries use local calendar dates',()=>{
 for(const year of [2026,2027,2030]){
  assert.equal(inSeason(new Date(year,9,23,23,59,59),HALLOWEEN),false);
  assert.equal(inSeason(new Date(year,9,24,0,0,0),HALLOWEEN),true);
  assert.equal(inSeason(new Date(year,9,31,23,59,59),HALLOWEEN),true);
  assert.equal(inSeason(new Date(year,10,1,0,0,0),HALLOWEEN),false);
 }
});
test('next calendar midnight accounts for daylight-saving changes',()=>{
 for(const date of [new Date(2026,9,25,0),new Date(2026,2,29,0),new Date(2026,9,31,23,59)]){
  const next=new Date(date.getTime()+untilLocalMidnight(date));
  assert.equal(next.getHours(),0);assert.equal(next.getMinutes(),0);assert.notEqual(next.getDate(),date.getDate());
 }
});
test('reusable ranges support December and year-crossing seasons',()=>{
 const december={start:[12,1],end:[12,31]},winter={start:[12,20],end:[1,5]};
 assert.equal(inSeason(new Date(2026,11,31),december),true);
 assert.equal(inSeason(new Date(2027,0,1),december),false);
 assert.equal(inSeason(new Date(2027,0,3),winter),true);
 assert.equal(inSeason(new Date(2027,6,1),winter),false);
});
test('light defaults on, preserves off, and does not share lamp storage',()=>{
 assert.equal(savedSeasonalLight(null),true);assert.equal(savedSeasonalLight('off'),false);assert.equal(savedSeasonalLight('on'),true);
 assert.equal(HALLOWEEN.key,'soul-halloween-pumpkin-light');
});
