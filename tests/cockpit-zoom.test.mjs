import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

test('cockpit zoom guard blocks zoom inputs, preserves clicks/scroll and cleans up on exit',()=>{
 const listeners=new Map();let cleanup;
 const document={addEventListener:(name,fn,options)=>listeners.set(name,{fn,options}),removeEventListener:name=>listeners.delete(name)};
 const mod={exports:{}};
 const code=ts.transpileModule(fs.readFileSync('components/mate/useCockpitZoomGuard.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 new Function('module','exports','require','document',code)(mod,mod.exports,()=>({useEffect:fn=>{cleanup=fn();}}),document);
 mod.exports.useCockpitZoomGuard(false);assert.equal(listeners.size,0);
 mod.exports.useCockpitZoomGuard(true);
 const fire=(name,props={})=>{let prevented=false;listeners.get(name)?.fn({cancelable:true,preventDefault(){prevented=true;},...props});return prevented;};
 assert.equal(fire('wheel',{ctrlKey:true}),true);assert.equal(listeners.get('wheel').options.passive,false);
 assert.equal(fire('wheel'),false);assert.equal(fire('click'),false);
 for(const key of ['+','=','-','_','0']) for(const modifier of ['ctrlKey','metaKey']) assert.equal(fire('keydown',{key,[modifier]:true}),true);
 assert.equal(fire('keydown',{key:'r',metaKey:true}),false);
 assert.equal(fire('keydown',{key:'+'}),false);
 assert.equal(fire('touchmove',{touches:[{},{}]}),true);
 assert.equal(fire('touchmove',{touches:[{}]}),false);
 assert.equal(fire('gesturestart'),true);assert.equal(fire('gesturechange'),true);assert.equal(fire('dblclick'),true);
 cleanup();assert.equal(listeners.size,0);
});
test('initial dome sizing is based on the logical viewport and TV waits for return completion',()=>{
 const page=fs.readFileSync('components/home/CanonicalHomepage.tsx','utf8');
 assert.match(page,/data-dome-narrow={view.width<760 \|\| undefined}/);
 const css=fs.readFileSync('components/mate/mate.css','utf8');
 assert.doesNotMatch(css,/@media \(max-width: 759px\)/);
 assert.match(css,/\.on-glass\[data-dome-narrow\] h2/);
 const mate=fs.readFileSync('components/mate/MateExperience.tsx','utf8');
 assert.match(mate,/const tvVisible=\(!cockpit && progress===0\) \|\| \(cockpit && progress===1/);
 assert.match(mate,/data-tv-visible={!!tvVisible}/);
 assert.match(mate,/useCockpitZoomGuard\(thirdActive && !arcadeOpen\)/);
});
