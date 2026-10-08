import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const cache=new Map();
function load(file){if(cache.has(file))return cache.get(file);const loaded={exports:{}};new Function('module','exports','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(loaded,loaded.exports,name=>load(path.resolve(path.dirname(file),name+'.ts')));cache.set(file,loaded.exports);return loaded.exports;}
const n=load(path.resolve('lib/ship/charlieNavigation.ts')),g=load(path.resolve('lib/ship/domeGeometry.ts'));
test('all approaches are reachable through collision-free routes in both directions',()=>{
 const c=g.DEFAULT_DOME,targets=n.approaches(c);
 for(const [name,a] of Object.entries(targets)){
  assert.ok(n.walkable(a.point,c),`${name} approach is walkable ${JSON.stringify(a.point)}`);
  const route=n.findPath(targets.chair.point,a.point,c);assert.ok(route,`${name} reachable`);
  let p=targets.chair.point;for(const q of route){assert.ok(n.clearSegment(p,q,c));p=q;}
  assert.ok(n.findPath(a.point,targets.chair.point,c),`${name} return`);
 }
});
test('floor projection round trips across viewports and camera pitches',()=>{
 for(const view of [{width:1440,height:900},{width:844,height:390}])for(const pitch of [0,-8,12]){
  const c={...g.DEFAULT_DOME,pitch};for(const p of [{x:0,z:2},{x:-3,z:4},{x:4,z:3}]){const screen=g.project({...p,y:-.42},c,view),q=n.floorPoint(screen.x,screen.y,c,view);assert.ok(Math.hypot(q.x-p.x,q.z-p.z)<.00001);}
 }
});
test('solid furniture and out-of-room destinations are rejected',()=>{
 const c=g.DEFAULT_DOME;for(const p of [{x:0,z:8},{x:0,z:7.2},{x:30,z:0}])assert.equal(n.walkable(p,c),false);
});
function movementHarness(){
 let state,frame,time=0;const effects=[];
 const react={useRef:value=>({current:value}),useState:value=>{state=value;return [value,v=>{state=v;}];},useCallback:fn=>fn,useEffect:fn=>effects.push(fn)};
 const mod={exports:{}};
 new Function('module','exports','require','requestAnimationFrame','cancelAnimationFrame','performance',ts.transpileModule(fs.readFileSync('components/ship/useCharlieMovement.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(mod,mod.exports,name=>name==='react'?react:load(path.resolve(name.replace('@/', '')+'.ts')),fn=>{frame=fn;return 1;},()=>{}, {now:()=>0});
 const api=mod.exports.useCharlieMovement(g.DEFAULT_DOME);effects.forEach(fn=>fn());
 return {api,state:()=>state,advance:(seconds=30)=>{for(let i=0;i<seconds*60;i++){time+=1000/60;frame(time);}}};
}
test('seating, interruptions and immediate versus arrival UI responses',()=>{
 const h=movementHarness();let tv=0,merch=0,arcade=0,newsletter=0;
 h.api.interact('tv',()=>tv++);assert.equal(tv,1);assert.equal(h.state().mode,'pilot-seated');
 h.api.interact('chair');assert.equal(h.state().mode,'pilot-seated');
 h.api.walk({x:0,z:3});assert.equal(h.state().phase,'rising');h.advance();assert.equal(h.state().mode,'standing');
 h.api.interact('arcade',()=>arcade++);assert.equal(arcade,0);assert.equal(h.state().mode,'walking');
 h.api.interact('merch',()=>merch++);assert.equal(merch,1);h.advance();assert.equal(arcade,0);assert.equal(h.state().mode,'standing');
 h.api.interact('newsletter',()=>newsletter++);assert.equal(newsletter,1);h.advance();assert.equal(h.state().mode,'sofa-seated');
 h.advance();assert.equal(h.state().mode,'sofa-seated');
 h.api.walk({x:0,z:2});h.advance();assert.equal(h.state().mode,'standing');assert.equal(h.state().position.z,2);
 h.api.interact('arcade',()=>arcade++);h.advance();assert.equal(arcade,1);h.advance();assert.equal(arcade,1);
 h.api.interact('chair');h.advance();assert.equal(h.state().mode,'pilot-seated');
});
test('occupied chair is inert, floor clicks stand, and seating can be redirected without teleporting',()=>{
 const h=movementHarness();h.api.interact('chair');assert.equal(h.state().phase,null);assert.equal(h.state().mode,'pilot-seated');
 h.api.walk({x:0,z:3});assert.equal(h.state().phase,'rising');const start={...h.state().position};
 h.advance(.2);assert.equal(h.state().phase,'rising');assert.ok(Math.hypot(h.state().position.x-start.x,h.state().position.z-start.z)<.2);
 h.api.interact('merch');h.advance();assert.equal(h.state().mode,'standing');
 h.api.interact('chair');for(let i=0;i<1200&&h.state().phase!=='sitting';i++)h.advance(1/60);
 assert.equal(h.state().phase,'sitting');h.advance(.45);const before={...h.state().position};
 h.api.walk({x:0,z:2});assert.deepEqual(h.state().position,before);assert.equal(h.state().phase,'rising');h.advance();assert.equal(h.state().mode,'standing');assert.equal(h.state().position.z,2);
});
test('paper stays with the sofa reader and is put away before the next walk',()=>{
 const h=movementHarness();h.api.interact('newsletter');h.advance();assert.equal(h.state().paper,1);assert.equal(h.state().mode,'sofa-seated');
 h.advance();assert.equal(h.state().paper,1);
 h.api.walk({x:0,z:3});h.advance(.3);assert.equal(h.state().paper,0);h.advance();assert.equal(h.state().mode,'standing');
});

test('free floor arrival retains walking heading instead of the previous interaction heading',()=>{
 const h=movementHarness();h.api.interact('merch');h.advance();
 const anchorYaw=h.state().yaw;
 h.api.walk({x:0,z:3});let before;
 for(let i=0;i<1800;i++){before={...h.state()};h.advance(1/60);if(h.state().mode==='standing')break;}
 assert.equal(h.state().mode,'standing');
 const delta=(a,b)=>Math.abs(((a-b+540)%360+360)%360-180);
 assert.ok(delta(h.state().yaw,before.yaw)<5);
 assert.ok(delta(h.state().yaw,anchorYaw)>20);
 const arrived=h.state().yaw;h.advance(2);assert.equal(h.state().yaw,arrived);
});
