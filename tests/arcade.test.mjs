import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { harness, nodes } from './helpers/interaction-harness.mjs';
const alien = (extra={}) => ({id:1,x:100,y:100,vx:0,vy:0,spin:1,...extra});
const pointer = {preventDefault(){},stopPropagation(){},clientX:200,currentTarget:{getBoundingClientRect:()=>({left:100,top:650,width:32,height:32})}};

test('arcade preserves random launch, 16ms physics and offscreen removal',()=>{
 const h=harness();h.game.launchAlien(pointer);const a=h.game.flyingAliens[0];
 assert.equal(a.x,116);assert.equal(a.y,666);assert.ok(Math.hypot(a.vx,a.vy)>=5 && Math.hypot(a.vx,a.vy)<=9);assert.ok([-1,1].includes(a.spin));
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
test('tractor geometry, one capture per id, three counters and 360ms removal survive extraction',()=>{
 const h=harness();h.game.ufoPosRef.current={x:200,y:200};h.game.tractorBeamActiveRef.current=true;
 assert.equal(h.game.touchesTractorBeam(alien({x:200,y:235})),true);assert.equal(h.game.touchesTractorBeam(alien({x:300,y:235})),false);
 let g=h.tick([alien({x:200,y:235}),alien({id:2,x:200,y:235,isSkull:true}),alien({id:3,x:200,y:235,isSkull:true,isBlackSkull:true})]);
 assert.deepEqual(g.tractorCounts,{alien:1,whiteSkull:1,blackSkull:1});assert.ok(g.flyingAliens.every(a=>a.tractorCaptured));
 g.recordTractorCapture(g.flyingAliens[0]);assert.equal(h.game.tractorCounts.alien,1);
 g=h.tick(null,180);assert.ok(g.flyingAliens[0].tractorScale<1);assert.equal(h.tick(null,180).flyingAliens.length,0);
 h.game.toggleUfoOrbit();assert.equal(h.game.tractorBeamActiveRef.current,false);assert.equal(h.game.ufoOrbiting,true);
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
test('public TV preserves two-position drag and mid-drag cleanup independently of arcade',()=>{
 const h=harness(1280,720,'tv');h.advance(16);h.advance(16);h.game.dragTv(pointer);h.event('pointermove',{clientX:150});h.event('pointerup');assert.equal(h.game.tvPos.x,26);
 h.game.dragTv(pointer);h.event('pointermove',{clientX:250});h.event('pointerup');assert.equal(h.game.tvPos.x,934);
 const position=h.game.tvPos.x;h.game.dragTv(pointer);h.event('pointermove',{clientX:205});h.event('pointerup');assert.equal(h.game.tvPos.x,position);
 h.game.dragTv(pointer);
 h.unmount();assert.equal(h.intervals.size,0);assert.equal(h.timers.size,0);for(const set of h.listeners.values()) assert.equal(set.size,0);
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
