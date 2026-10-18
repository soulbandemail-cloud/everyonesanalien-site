import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { harness, nodes } from './helpers/interaction-harness.mjs';
const alien = (extra={}) => ({id:1,x:100,y:100,vx:0,vy:0,spin:1,...extra});
const pointer = {preventDefault(){},stopPropagation(){},clientX:200,currentTarget:{getBoundingClientRect:()=>({left:100,top:650,width:32,height:32})}};

test('arcade preserves random launch, 16ms physics and offscreen removal',()=>{
 const h=harness();h.game.launchAlien(pointer);const a=h.game.flyingAliens[0];
 assert.ok(a.vy<0);assert.equal(a.x,116);assert.equal(a.y,666);assert.ok(Math.hypot(a.vx,a.vy)>=2.5 && Math.hypot(a.vx,a.vy)<=4.5);assert.ok([-1,1].includes(a.spin));
 assert.equal([...h.intervals.values()][0].ms,16);
 assert.equal(h.tick([alien({x:-81})]).flyingAliens.length,0);
});
test('heart outcomes preserve pulse, white flash and black Wombo timings',()=>{
 for(const kind of ['alien','white','black']) {
  const h=harness();const g=h.tick([alien({x:556,y:198,isSkull:kind!=='alien',isBlackSkull:kind==='black'})]);
  assert.equal(g.flyingAliens.length,0);assert.equal(g.ringBlinking,true);
  if(kind==='alien'){assert.ok(g.heartPulse.key);assert.equal(g.hideCursorUfo,true);assert.equal(g.flashbang,null);}
  else {assert.equal(g.flashbang.type,kind);}
  if(kind==='black') assert.ok(g.womboComboKey);
  assert.equal(h.advance(420).ringBlinking,false);
  h.advance(3000);assert.equal(h.game.flashbang,null);assert.equal(h.game.heartPulse.key,0);assert.equal(h.game.womboComboKey,0);
 }
});
test('drawn discharge stuns at impact, stays frozen, then progresses white to black with exit/cooldown protection',()=>{
 const h=harness(),engine=h.game.electricity.engine;
 const draw=()=>{engine.end();engine.charge=.5;engine.begin(1,{x:100,y:100},32);engine.aim(1,{x:200,y:100});engine.draw(0);};
 draw();const point=engine.drawing.points[4];let g=h.tick([alien({...point,vx:2})]);
 assert.equal(g.flyingAliens[0].isSkull,true);assert.ok(g.flyingAliens[0].stunnedUntil);assert.equal(g.flyingAliens[0].needsZapExit,true);
 const frozen={x:g.flyingAliens[0].x,y:g.flyingAliens[0].y};engine.aim(1,{x:100,y:200});engine.draw(0);g=h.tick();assert.equal(g.flyingAliens[0].x,frozen.x);assert.equal(g.flyingAliens[0].y,frozen.y);
 engine.end();g=h.tick(null,3000);assert.equal(g.flyingAliens[0].stunnedUntil,undefined);assert.equal(Boolean(g.flyingAliens[0].isBlackSkull),false);
 draw();g=h.tick([alien({...point,isSkull:true})]);assert.equal(g.flyingAliens[0].turningBlack,true);
 engine.end();g=h.tick(null,3000);assert.equal(g.flyingAliens[0].isBlackSkull,true);
 draw();g=h.tick([alien({...point,needsZapExit:true})]);assert.equal(g.flyingAliens[0].stunnedUntil,undefined);
 g=h.tick([alien({...point,lastZapCatch:16080})]);assert.equal(g.flyingAliens[0].stunnedUntil,undefined);
 h.unmount();
});
test('beam curves momentum, releases cleanly and restores scale; saucer contact never scores',()=>{
 const h=harness();h.game.ufoPosRef.current={x:200,y:200};h.game.tractorBeamActiveRef.current=true;
 let g=h.tick([alien({x:213,y:275,vx:2,vy:0})]);
 assert.ok(g.flyingAliens[0].vx<2&&g.flyingAliens[0].vx>0);assert.ok(g.flyingAliens[0].vy<0);
 assert.ok(g.flyingAliens[0].tractorScale<1&&g.flyingAliens[0].tractorScale>=.7);
 assert.deepEqual(g.tractorCounts,{alien:0,whiteSkull:0,blackSkull:0});
 h.game.ufoPosRef.current={x:800,y:400};const released=g.flyingAliens[0];
 g=h.tick();assert.equal(g.flyingAliens[0].vx,released.vx);assert.equal(g.flyingAliens[0].vy,released.vy);
 for(let i=0;i<30;i++)g=h.tick();assert.equal(g.flyingAliens[0].tractorScale,1);
 h.game.ufoPosRef.current={x:200,y:200};h.game.tractorBeamActiveRef.current=false;
 g=h.tick([alien({x:200,y:200})]);assert.equal(g.flyingAliens.length,1);assert.deepEqual(g.tractorCounts,{alien:0,whiteSkull:0,blackSkull:0});
 h.unmount();
});
test('all unassisted heart impacts score exactly once, including a swept crossing',()=>{
 for(const [type,flags] of [['alien',{}],['whiteSkull',{isSkull:true}],['blackSkull',{isSkull:true,isBlackSkull:true}]]){
  const h=harness(),head=alien({x:490,y:198,vx:130,...flags});
  let g=h.tick([head]);assert.equal(g.flyingAliens.length,0);assert.equal(g.tractorCounts[type],1);
  g.recordBasket(head);g=h.tick();assert.equal(g.tractorCounts[type],1);h.unmount();
 }
});
test('independent footer reflection remains; TV collision and rendering are gone',()=>{
 const h=harness(),g=h.game;
 const f=alien({x:200,y:650,vx:4,vy:40});const result=g.reflectAlienOffFooterLine(f,{...f,x:204,y:690},10000);assert.equal(result.vy,-40);assert.equal(result.y,652);
 assert.equal(g.reflectAlienOffFooterLine({...f,lastFooterBounce:9999},{...f,y:690},10000).vy,40);
 assert.doesNotMatch(fs.readFileSync('components/arcade/ArcadeGame.tsx','utf8'),/usePortableTv|tvBody|antenna|television|lastTvBounce|reflectAlienOffTv|iframe/i);
 assert.doesNotMatch(fs.readFileSync('components/arcade/arcade.css','utf8'),/space-tv/);
 assert.ok(nodes(h.tree).every(el=>el.type!=='iframe'));
 h.unmount();
});
test('arcade contains no Wish/Pong runtime or UI and reopening starts fresh',()=>{
 const h=harness();
 for(const el of nodes(h.tree)) {
  assert.doesNotMatch(el.props?.className ?? '', /wish|pong|shooting|(?:^|\s)stars(?:\s|$)/i);
  assert.notEqual(el.type,'input');assert.notEqual(el.type,'form');
  assert.notEqual(el.props?.children,'MAKE A WISH');
 }
 assert.doesNotMatch(fs.readFileSync('components/arcade/ArcadeGame.tsx','utf8'), /wish|pong|shooting|className="stars"/i);
 h.game.launchAlien(pointer);assert.equal(h.game.flyingAliens.length,1);h.unmount();
 const reopened=harness();assert.equal(reopened.game.electricity.engine.charge,0);assert.equal(reopened.game.electricity.engine.drawing,null);assert.equal(reopened.game.flyingAliens.length,0);assert.deepEqual(reopened.game.tractorCounts,{alien:0,whiteSkull:0,blackSkull:0});reopened.unmount();
});

test('rendered orbital angle generates charge, overload reuses blackout and stops orbit; release/cancel/exit clean up zap',()=>{
 const h=harness();h.setOrbitAngle(Math.PI);h.advance(16);assert.equal(h.game.electricity.engine.charge,0);
 h.game.toggleUfoOrbit();h.setOrbitAngle(Math.PI);h.advance(16);assert.ok(Math.abs(h.game.electricity.engine.charge-.1)<1e-12);
 h.setOrbitAngle(10*Math.PI);h.advance(16);assert.equal(h.game.electricity.engine.charge,0);assert.equal(h.game.ufoOrbiting,false);assert.equal(h.game.ufoOrbitingRef.current,false);assert.equal(h.game.flashbang.type,'black');assert.equal(h.game.womboComboKey,0);
 const key=h.game.flashbang.key;h.advance(100);assert.equal(h.game.flashbang.key,key);assert.equal(h.game.electricity.engine.charge,0);
 h.rootEvent('pointerdown',{clientX:100,clientY:100});assert.equal(h.game.electricity.engine.drawing,null);
 h.game.toggleUfoOrbit();
 h.game.electricity.engine.charge=.25;h.rootEvent('pointerdown',{clientX:100,clientY:100,target:{closest:()=>({})}});assert.equal(h.game.electricity.engine.drawing,null);
 h.rootEvent('pointerdown',{clientX:100,clientY:100});
 h.event('pointermove',{pointerId:1,clientX:160,clientY:100,preventDefault(){}});assert.ok(h.game.electricity.engine.drawing.points.length>1);
 h.event('pointerup',{pointerId:1,clientX:160,clientY:100});assert.equal(h.game.electricity.engine.drawing,null);assert.equal(h.captured.size,0);
 h.game.electricity.engine.charge=.25;h.rootEvent('pointerdown',{clientX:100,clientY:100});h.event('pointercancel',{pointerId:1});assert.equal(h.game.electricity.engine.drawing,null);
 h.game.electricity.engine.charge=.25;h.rootEvent('pointerdown',{clientX:100,clientY:100});
 h.event('pointermove',{pointerId:1,clientX:160,clientY:100,preventDefault(){}});
 h.advance(1000);h.advance(150);assert.equal(h.game.electricity.engine.drawing,null);assert.equal(h.captured.size,0);
 h.game.electricity.engine.charge=.25;h.event('pointermove',{pointerId:1,clientX:200,clientY:100,preventDefault(){}});assert.equal(h.game.electricity.engine.drawing,null);
 h.rootEvent('pointerdown',{clientX:100,clientY:100});h.unmount();assert.equal(h.game.electricity.engine.drawing,null);assert.equal(h.intervals.size,0);assert.equal(h.timers.size,0);assert.equal(h.captured.size,0);
 for(const set of [...h.listeners.values(),...h.rootListeners.values()]) assert.equal(set.size,0);
});

test('beam steering is consistent across frame intervals and scale never changes collision size',()=>{
 const simulate=ms=>{const h=harness();h.game.ufoPosRef.current={x:200,y:200};h.game.tractorBeamActiveRef.current=true;
  h.tick([]);let body=alien({x:205,y:275,vx:.2,vy:0});
  for(let t=0;t<160;t+=ms)body=h.tick([body],ms).flyingAliens[0];h.unmount();return body;};
 const fast=simulate(8),slow=simulate(32);
 assert.ok(Math.hypot(fast.x-slow.x,fast.y-slow.y)<.6);
 assert.ok(Math.abs(fast.vx-slow.vx)<.15);
 for(const tractorScale of [.7,1]){
  const h=harness();h.game.ufoPosRef.current={x:200,y:200};h.game.tractorBeamActiveRef.current=true;
  assert.equal(h.tick([alien({x:200,y:212,vy:-4,tractorScale})]).flyingAliens.length,0);h.unmount();
 }
});

test('launcher band cannot start the beam or immediately collect newly launched heads',()=>{
 for(const pointerType of ['mouse','touch']){
  const h=harness();h.win.matchMedia=()=>({matches:true});
  h.event('pointerdown',{pointerType,button:0,clientX:200,clientY:690});
  assert.equal(h.game.tractorBeamActiveRef.current,false);
  h.game.ufoPosRef.current={x:200,y:690};
  assert.equal(h.tick([alien({x:200,y:690,vy:-6})]).flyingAliens.length,1);
  h.event('pointerup',{pointerId:1});
  h.event('pointerdown',{pointerType,button:0,clientX:200,clientY:300});
  assert.equal(h.game.tractorBeamActiveRef.current,true);
  h.game.launchAlien(pointer);assert.equal(h.game.tractorBeamActiveRef.current,false);
  h.unmount();
 }
});

 test('zap requires orbit and leaving orbit keeps unused charge',()=>{
  const h=harness();h.game.electricity.engine.charge=.5;
  h.rootEvent('pointerdown',{clientX:100,clientY:100});
  assert.equal(h.game.electricity.engine.drawing,null);assert.equal(h.game.electricity.engine.charge,.5);
  h.game.toggleUfoOrbit();h.rootEvent('pointerdown',{clientX:100,clientY:100});
  assert.ok(h.game.electricity.engine.drawing);
  h.event('pointermove',{pointerId:1,clientX:150,clientY:100,preventDefault(){}});
  const saved=h.game.electricity.engine.charge;h.game.toggleUfoOrbit();h.advance(16);
  assert.equal(h.game.electricity.engine.drawing,null);assert.equal(h.captured.size,0);
  assert.equal(h.game.electricity.engine.charge,saved);h.advance(1000);
  assert.equal(h.game.electricity.engine.charge,saved);h.unmount();
 });

test('UFO only collects upward contact through an active beam, never side or top hits',()=>{
 for(const active of [false,true])for(const [name,head] of [['below',{x:200,y:212,vy:-4}],['side',{x:219,y:200,vx:-4}],['above',{x:200,y:188,vy:4}]]){
  const h=harness();h.game.ufoPosRef.current={x:200,y:200};h.game.tractorBeamActiveRef.current=active;
  const g=h.tick([alien(head)]);assert.equal(g.flyingAliens.length,active&&name==='below'?0:1);
  assert.deepEqual(g.tractorCounts,{alien:0,whiteSkull:0,blackSkull:0});h.unmount();
 }
});
