import {test} from 'node:test';
import assert from 'node:assert/strict';
import {harness} from './helpers/interaction-harness.mjs';

const pointer={clientX:200,preventDefault(){},stopPropagation(){}};
test('TV bootstraps its conditional mount, measures bottom-right, snaps and preserves side on resize',()=>{
 const h=harness(1280,720,'tv');
 assert.equal(h.game.tvPos,null);assert.equal(h.game.tvRef.current,null);
 h.advance(16);assert.ok(h.game.tvPos);assert.ok(h.game.tvRef.current);
 h.advance(16);assert.deepEqual(h.game.tvPos,{x:934,y:444});
 assert.equal(h.listeners.get('resize').size,1);
 h.win.innerWidth=2400;h.win.innerHeight=900;h.event('resize');h.advance(16);
 assert.deepEqual(h.game.tvPos,{x:2054,y:624});
 h.game.dragTv(pointer);h.event('pointermove',{clientX:150});h.event('pointerup');
 assert.deepEqual(h.game.tvPos,{x:26,y:624});
 h.win.innerWidth=800;h.win.innerHeight=600;h.event('resize');h.advance(16);
 assert.deepEqual(h.game.tvPos,{x:26,y:324});
 h.game.dragTv(pointer);h.event('pointermove',{clientX:250});h.event('pointerup');
 assert.deepEqual(h.game.tvPos,{x:454,y:324});
 h.game.setTvExpanded(true);h.game.dragTv(pointer);h.event('pointermove',{clientX:150});h.event('pointerup');
 assert.deepEqual(h.game.tvPos,{x:454,y:324});assert.equal(h.game.tvExpanded,true);
 h.unmount();assert.equal(h.timers.size,0);assert.equal(h.listeners.get('resize').size,0);
});
test('unmount before bootstrap cancels initialization',()=>{
 const h=harness(1280,720,'tv');assert.equal(h.game.tvPos,null);
 h.unmount();assert.equal(h.timers.size,0);
});
