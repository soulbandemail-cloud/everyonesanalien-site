import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const m={exports:{}};
new Function('module','exports',ts.transpileModule(fs.readFileSync('lib/ship/charlieBlink.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(m,m.exports);
test('blink lasts 180ms after randomized interval, with slower reopening',()=>{
 const blink=m.exports.createBlink(()=>.5);
 assert.equal(blink.tick(9.99),0);
 assert.ok(blink.tick(.065)>.9);
 assert.ok(blink.tick(.06)>.1);
 assert.equal(blink.tick(.07),0);
 assert.equal(blink.tick(9),0);
});
test('occasional double blink has a quiet pause and then resets its interval',()=>{
 const blink=m.exports.createBlink(()=>0);
 assert.equal(blink.tick(6.9),0);
 assert.ok(blink.tick(.15)>.9);
 assert.equal(blink.tick(.15),0);
 assert.ok(blink.tick(.15)>.9);
 assert.equal(blink.tick(.15),0);
 assert.equal(blink.tick(6),0);
});
test('blink is frame-rate independent at 30 and 60fps',()=>{
 const a=m.exports.createBlink(()=>.5),b=m.exports.createBlink(()=>.5);
 for(let i=0;i<400;i++){const value=a.tick(1/30);b.tick(1/60);assert.ok(Math.abs(value-b.tick(1/60))<1e-9);}
});
