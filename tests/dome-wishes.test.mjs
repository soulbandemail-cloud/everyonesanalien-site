import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { harness, nodes } from './helpers/interaction-harness.mjs';
const alien = (extra={}) => ({id:1,x:100,y:100,vx:0,vy:0,spin:1,...extra});
const pointer = {preventDefault(){},stopPropagation(){},clientX:200};
test('ordinary wishes, forbidden rules, persistent Pong, paddle drag and responsive reflection',()=>{
 for(const width of [390,1280]) {
  const h=harness(width,800,'home');h.game.setWish('hello');h.game.closeWishPrompt();assert.equal(h.game.wishBarrierRef.current.starOffsets.length,10);h.advance(900);assert.equal(h.game.wishBarrierRef.current,null);
  h.game.setWish('bring back to life');h.game.closeWishPrompt();assert.ok(h.game.wishRulesKey);assert.equal(h.game.wishBarrierRef.current,null);h.advance(8000);assert.equal(h.game.wishRulesKey,0);
  h.game.setWish(' PONG ');h.game.closeWishPrompt();assert.equal(h.game.wishBarrierRef.current.activeUntil,Infinity);assert.equal(h.game.wishBarrierRef.current.starOffsets.length,5);
  const y=800*(width<640?.24:.34),a=alien({x:width/2-60,y:y-30,vy:60});
  const bounce=h.game.reflectAlienOffWishStars(a,{...a,y:y+30},30000);assert.equal(bounce.vy,-60);assert.equal(bounce.y,y-18);
  h.game.dragWishPaddle(pointer);h.event('pointermove',{clientX:240});assert.equal(h.game.pongWish.x,40);assert.equal(h.game.wishBarrierRef.current.xOffset,40);
  h.event('pointerup');assert.equal(h.listeners.get('pointermove').size,0);
 }
});
test('home stars are catchable; input/rules are conditional and no alien game runs',()=>{
 const h=harness(1280,720,'home');
 assert.equal(h.game.wishPrompt,false);assert.equal(h.game.wishRulesKey,0);
 const stars=nodes(h.tree).filter(el=>el.props?.className?.startsWith('shooting-star '));
 assert.equal(stars.length,11);assert.ok(stars.every(el=>typeof el.props.onPointerDown==='function'));
 stars[0].props.onPointerDown(pointer);assert.equal(h.game.wishPrompt,true);
 assert.ok(nodes(h.tree).some(el=>el.type==='input'));
 for(const wish of ['another wish','more wishes','infinite wishes','kill','dead','die','death','back to life','fall in love']) {
  h.game.catchShootingStar(pointer);h.game.setWish(wish);h.game.closeWishPrompt();
  assert.equal(h.game.wishPrompt,false);assert.ok(h.game.wishRulesKey);assert.equal(h.game.wishBarrierRef.current,null);assert.equal(h.game.pongWish,null);
  h.advance(7999);assert.ok(h.game.wishRulesKey);h.advance(1);assert.equal(h.game.wishRulesKey,0);
 }
 h.game.setWish('pong');h.game.closeWishPrompt();h.game.dragWishPaddle(pointer);
 assert.equal(h.intervals.size,0);h.unmount();assert.equal(h.timers.size,0);for(const set of h.listeners.values())assert.equal(set.size,0);
 assert.doesNotMatch(fs.readFileSync('components/home/DomeWishes.tsx','utf8'),/FlyingAlien|setInterval|tractor|ufo|zap|wombo/i);
});
test('catching another star resets Pong and stale timers cannot clear a newer wish',()=>{
 const h=harness(390,844,'home');h.game.setWish('ordinary');h.game.closeWishPrompt();h.advance(100);
 h.game.catchShootingStar(pointer);h.game.setWish('pong');h.game.closeWishPrompt();h.advance(800);
 assert.equal(h.game.wishBarrierRef.current.activeUntil,Infinity);
 h.game.catchShootingStar(pointer);assert.equal(h.game.pongWish,null);assert.equal(h.game.wishBarrierRef.current,null);assert.equal(h.game.wishPrompt,true);
 h.unmount();
});
