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

test('telescope catches on release only, rejects drags and preserves original wish rules',()=>{
 const h=harness(1280,720,'home');h.setTvProps({tapToCatch:true});
 const star=()=>nodes(h.tree).find(el=>el.props?.className==='shooting-star shooting-star-launch');
 const event={...pointer,clientX:200,clientY:100,pointerId:1};
 star().props.onPointerDown(event);assert.equal(h.game.wishPrompt,false);
 star().props.onPointerUp({...event,clientX:220});assert.equal(h.game.wishPrompt,false);
 star().props.onPointerDown(event);star().props.onPointerUp({...event,clientX:202});assert.equal(h.game.wishPrompt,true);
 h.game.setWish('more wishes');h.game.closeWishPrompt();assert.ok(h.game.wishRulesKey);
 h.unmount();
});
test('telescope wish stars originate at the input centre, including a rotated phone',()=>{
 for(const angle of [0,90]){
  const h=harness(1280,720,'home');h.game.catchShootingStar(pointer);
  const input=nodes(h.tree).find(el=>el.type==='input');
  input.props.ref.current={getBoundingClientRect:()=>angle?{left:400,top:500,width:40,height:200}:{left:500,top:300,width:200,height:40},closest:()=>({clientWidth:1280,clientHeight:720,getBoundingClientRect:()=>angle?{left:0,top:0,width:720,height:1280}:{left:0,top:0,width:1280,height:720},closest:()=>({dataset:{presentationAngle:String(angle),presentationScale:'1'}})})};
  h.game.setWish('stars');h.game.closeWishPrompt();
  const burst=nodes(h.tree).find(el=>el.props?.className==='wish-burst-layer ');
  assert.equal(burst.props.style['--wish-origin-x'],'600px');assert.equal(burst.props.style['--wish-origin-y'],angle?'300px':'320px');
  h.unmount();
 }
});
