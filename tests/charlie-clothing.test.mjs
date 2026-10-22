import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const compile=file=>ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function load(file){const m={exports:{}};new Function('module','exports','require',compile(file))(m,m.exports,name=>load(name.includes('charlieAmbient')?'lib/ship/charlieAmbient.ts':'lib/ship/charlieEmotes.ts'));return m.exports;}
const c=load('lib/ship/clothing.ts'),a=load('lib/ship/alienVolume.ts');
test('collection has stable metadata and validates persisted selection',()=>{
 assert.equal(c.CLOTHING.length,1);const item=c.CLOTHING[0];assert.equal(item.name,'SOUL Ringer Tee #1');assert.ok(fs.existsSync('public'+item.thumbnail));
 assert.equal(c.validOutfit(item.id),item.id);assert.equal(c.validOutfit('invalid'),null);
 assert.equal(c.toggleOutfit(null,item.id),item.id);assert.equal(c.toggleOutfit(item.id,item.id),null);
});
test('spin swaps clothing at midpoint, ends after two rotations and fully clears haze',()=>{
 const spin={started:100,from:null,to:'soul-ringer-1'};
 assert.equal(c.clothesFrame(spin,100,null).yaw,0);
 assert.equal(c.clothesFrame(spin,459,null).outfit,null);
 assert.equal(c.clothesFrame(spin,460,null).outfit,spin.to);
 const end=c.clothesFrame(spin,820,null);assert.equal(end.yaw,720);assert.ok(Math.abs(end.haze)<1e-12);
 assert.equal(c.clothesFrame(undefined,900,spin.to).haze,0);
});
test('shirt remains volumetric and finite through seated, reading, walking and ambient poses',()=>{
 for(const yaw of [0,45,90,180,270])for(const pose of [{stand:1},{stand:0},{stand:0,reading:1},{stand:1,moving:1,gait:1.3},{ambient:{kind:'scratch',amount:1,time:2,side:1}}]){
  const mesh=a.alienVolume(yaw,0,false,{...pose,outfit:'soul-ringer-1'});
  assert.ok(mesh.every(f=>!/NaN|Infinity/.test(f.d)));assert.equal(mesh.filter(f=>f.texture).length,96);
  assert.ok(mesh.every((f,i)=>!i||f.depth>=mesh[i-1].depth));
 }
 assert.deepEqual(a.alienVolume(180,0),a.alienVolume(180,0,false,{outfit:null}));
});
function harness(reduced=false){
 let state,cleanup,time=0,id=0;const frames=new Map(),timers=new Map();let effect;
 const react={useState:initial=>{state??=initial;return [state,v=>{state=typeof v==='function'?v(state):v;}];},useEffect:fn=>{effect=fn;}};
 const m={exports:{}};
 new Function('module','exports','require','requestAnimationFrame','cancelAnimationFrame','setTimeout','clearTimeout','performance','window',compile('components/ship/useClothing.ts'))(m,m.exports,name=>name==='react'?react:c,fn=>{frames.set(++id,fn);return id;},i=>frames.delete(i),(fn,ms)=>{timers.set(++id,{fn,at:time+ms});return id;},i=>timers.delete(i),{now:()=>time},{matchMedia:()=>({matches:reduced})});
 return {update(outfit,revision,rail,ready){cleanup?.();m.exports.useClothesSpin({outfit,revision},rail,ready);cleanup=effect();},tick(ms=16){time+=ms;for(const [i,fn]of [...frames]){frames.delete(i);fn();}for(const [i,t]of [...timers])if(t.at<=time){timers.delete(i);t.fn();}},state:()=>state};
}
test('approach queues a change, arrival spins, navigation cancels safely without removing selection',()=>{
 const h=harness();h.update(null,0,false,false);h.tick();
 h.update('soul-ringer-1',1,true,false);h.tick();assert.equal(h.state().outfit,null);assert.equal(h.state().spin,undefined);
 h.update('soul-ringer-1',1,true,true);h.tick();assert.equal(h.state().spin.to,'soul-ringer-1');
 h.update('soul-ringer-1',1,false,false);h.tick();assert.equal(h.state().spin,undefined);assert.equal(h.state().outfit,'soul-ringer-1');h.tick(1000);assert.equal(h.state().outfit,'soul-ringer-1');
 h.update(null,2,true,true);h.tick();assert.equal(h.state().spin.to,null);h.tick(720);assert.equal(h.state().outfit,null);assert.equal(h.state().spin,undefined);
});
test('restored outfits and reduced motion never trigger a spin',()=>{
 for(const reduced of [false,true]){const h=harness(reduced);h.update('soul-ringer-1',0,false,false);h.tick();assert.equal(h.state().spin,undefined);assert.equal(h.state().outfit,'soul-ringer-1');}
 const h=harness(true);h.update(null,0,true,true);h.tick();h.update('soul-ringer-1',1,true,true);h.tick();assert.equal(h.state().spin,undefined);assert.equal(h.state().outfit,'soul-ringer-1');
});
test('local storage restores on a normal frame and toggles persist across remounts',()=>{
 const saved=new Map([['soul.charlie.clothing.v1','soul-ringer-1']]);
 const storage={getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)};
 function mount(){let state,frame;const effects=[];const react={useState:v=>{state=v;return [v,fn=>{state=typeof fn==='function'?fn(state):fn;}];},useEffect:fn=>effects.push(fn)};const m={exports:{}};
  new Function('module','exports','require','localStorage','requestAnimationFrame','cancelAnimationFrame','window',compile('components/ship/useClothing.ts'))(m,m.exports,n=>n==='react'?react:c,storage,fn=>{frame=fn;return 1;},()=>{},{addEventListener(){},removeEventListener(){}});
  const api=m.exports.useClothing();effects.forEach(fn=>fn());frame();return {api,state:()=>state};
 }
 const first=mount();assert.equal(first.state().outfit,'soul-ringer-1');first.api.choose('soul-ringer-1');assert.equal(mount().state().outfit,null);
 first.api.choose('soul-ringer-1');assert.equal(mount().state().outfit,'soul-ringer-1');
});
