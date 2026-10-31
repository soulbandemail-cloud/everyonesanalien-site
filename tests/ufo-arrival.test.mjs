import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
function scenario({ready=true,seen=false,reduced=false,portrait=false}={}){
 let effect,flight,glass,reveals=0,finished=0;const timers=[];
 const element={clientWidth:1000,style:{},querySelector:()=>({animate:(frames,options)=>{glass={frames,options};return {cancel(){}};}}),animate:(frames,options)=>{flight={frames,options};return {cancel(){}};}};
 const m={exports:{}};
 const code=ts.transpileModule(fs.readFileSync('components/mate/UfoArrival.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const react={useRef:()=>({current:element}),useId:()=>':test:',useEffect:fn=>effect=fn};
 new Function('module','exports','require','sessionStorage','matchMedia','document','setTimeout','clearTimeout','location',code)(m,m.exports,n=>n==='react'?react:{jsx:()=>null,jsxs:()=>null},{getItem:()=>seen?'1':null,setItem(){}},()=>({matches:reduced,addEventListener(){},removeEventListener(){}}),{addEventListener(){},removeEventListener(){}},(fn,ms)=>{timers.push({fn,ms});return timers.length;},()=>{},{search:''});
 m.exports.default({ready,enabled:true,portrait,onReveal:()=>reveals++,onFinished:()=>finished++});effect();
 return {flight,glass,timers,counts:()=>({reveals,finished})};
}
test('arrival waits for complete cockpit without starting or revealing',()=>{const s=scenario({ready:false});assert.equal(s.flight,undefined);assert.deepEqual(s.counts(),{reveals:0,finished:0});});
test('flight is bounded to one second and reveals at 900ms',()=>{const s=scenario();assert.equal(s.flight.options.duration,1000);assert.deepEqual(s.timers.map(t=>t.ms),[900,1000]);s.timers.forEach(t=>t.fn());assert.deepEqual(s.counts(),{reveals:1,finished:1});});
test('portrait counter-rotation ends before reveal',()=>{const s=scenario({portrait:true});assert.match(s.flight.frames[0].transform,/rotate\(90deg\)/);assert.match(s.flight.frames.find(f=>f.offset===.75).transform,/rotate\(0deg\)/);});
test('reduced motion and returning session bypass flight',()=>{for(const settings of [{reduced:true},{seen:true}]){const s=scenario(settings);assert.equal(s.flight,undefined);assert.deepEqual(s.counts(),{reveals:1,finished:1});}});

test('only exterior glass clears in the 100ms before the unchanged reveal',()=>{const s=scenario();assert.deepEqual(s.glass.frames.map(f=>[f.offset,f.opacity]),[[0,1],[.8,1],[.9,0],[1,0]]);assert.equal(s.glass.options.duration,1000);assert.equal(s.timers[0].ms,900);assert.ok(s.flight.frames.every(f=>!('opacity' in f)));});
