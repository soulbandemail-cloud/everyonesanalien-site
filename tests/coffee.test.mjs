import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const m={exports:{}};
new Function('module','exports',ts.transpileModule(fs.readFileSync('lib/ship/coffee.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(m,m.exports);
const {coffeePhase}=m.exports;
test('coffee lowers paper and grips before lifting, then returns before releasing',()=>{
 assert.equal(coffeePhase(0).lower,0);
 assert.equal(coffeePhase(1.4).reach,1);assert.equal(coffeePhase(1.4).lift,0);
 assert.equal(coffeePhase(4.2).lift,1);assert.equal(coffeePhase(4.2).sip,1);
 assert.equal(coffeePhase(6.7).lift,0);assert.equal(coffeePhase(6.7).reach,1);
 assert.equal(coffeePhase(8).lower,0);assert.equal(coffeePhase(8).reach,0);
 for(let t=0;t<=8;t+=.01)for(const value of Object.values(coffeePhase(t)))assert.ok(value>=0&&value<=1);
});
