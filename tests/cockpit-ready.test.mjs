import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
test('cold scene waits for raster, fonts and image decoding',async()=>{
 let value=false,effect,pending=true,fontDone,imageDone;const queue=[];
 const root={current:{querySelector:s=>s.includes("Mate cockpit")?{}:pending?{}:null,querySelectorAll:()=>[{getAttribute:()=>'/cold-poster.png'}]}};
 const m={exports:{}};const code=ts.transpileModule(fs.readFileSync('components/mate/useCockpitReady.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 new Function('module','exports','require','document','Image','HTMLImageElement','requestAnimationFrame','cancelAnimationFrame',code)(m,m.exports,()=>({useState:()=>[value,v=>value=v],useEffect:fn=>effect=fn}),{fonts:{ready:new Promise(r=>fontDone=r)}},class{decode(){return new Promise(r=>imageDone=r);}},class{},fn=>{queue.push(fn);return queue.length;},()=>{});
 assert.equal(m.exports.useCockpitReady(root,true),false);const cleanup=effect();
 const step=async()=>{queue.shift()?.();await Promise.resolve();await Promise.resolve();};
 await step();assert.equal(value,false);pending=false;await step();assert.equal(value,false);fontDone();await step();assert.equal(value,false);imageDone();await step();await step();await step();assert.equal(value,true);cleanup();
});
