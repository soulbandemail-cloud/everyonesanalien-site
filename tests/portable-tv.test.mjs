import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {harness,nodes} from './helpers/interaction-harness.mjs';

test('TV mounts immediately without positioning effects or drag controls',()=>{
 for(const [width,height] of [[1280,720],[390,844],[844,390]]) {
  const h=harness(width,height,'tv');
  assert.equal(nodes(h.tree).filter(n=>n.type==='iframe').length,1);
  assert.equal(nodes(h.tree).filter(n=>n.props?.className==='space-tv-handle').length,0);
  assert.equal(h.timers.size,0);assert.equal(h.listeners.size,0);
  h.win.innerHeight=250;h.event('resize');h.event('scroll');h.event('pointermove',{clientX:0,clientY:0});
  assert.equal(nodes(h.tree).find(n=>n.type==='aside').props.style,undefined);
  assert.equal(h.game.tvExpanded,false);
  h.unmount();
 }
});
test('TV retains the video, tap-to-maximise and background-to-close behaviour',()=>{
 const h=harness(390,844,'tv');
 const iframe=()=>nodes(h.tree).find(n=>n.type==='iframe');
 assert.match(iframe().props.src,/7623124860574731543.*start=0/);
 nodes(h.tree).find(n=>n.props?.className==='space-tv-open').props.onClick();
 assert.equal(h.game.tvExpanded,true);assert.equal(h.game.tvStarted,true);
 assert.match(iframe().props.src,/7623124860574731543.*start=1/);
 assert.equal(iframe().props.allowFullScreen,true);
 const aside=nodes(h.tree).find(n=>n.type==='aside');
 aside.props.onPointerDown({target:{},currentTarget:{}});assert.equal(h.game.tvExpanded,true);
 const background={};aside.props.onPointerDown({target:background,currentTarget:background});
 assert.equal(h.game.tvExpanded,false);assert.equal(h.game.tvStarted,true);
 h.unmount();
});
test('TV corner is CSS-anchored outside the moving camera frame; antennae are centred',()=>{
 const css=fs.readFileSync('app/globals.css','utf8');
 const tv=css.match(/\.space-tv \{([^}]+)\}/)[1];
 assert.match(tv,/position: fixed/);assert.match(tv,/right: 0/);assert.match(tv,/bottom: 0/);
 assert.doesNotMatch(tv,/transition/);
 assert.match(css,/\.space-tv-antenna \{[^}]*left: 50%;[^}]*translateX\(-50%\)/);
 assert.doesNotMatch(css,/space-tv-handle/);
 const mate=fs.readFileSync('components/mate/MateExperience.tsx','utf8');
 assert.match(mate,/<\/div>\s*<div className="public-tv-frame/);
 assert.match(mate,/data-tv-visible={!!tvVisible}/);
 assert.doesNotMatch(fs.readFileSync('components/home/CanonicalHomepage.tsx','utf8'),/PortableTV/);
 const frameCss=fs.readFileSync('components/mate/mate.css','utf8');
 assert.match(frameCss,/\.public-tv-frame \{[^}]*position:fixed;[^}]*inset:0/);
 assert.match(frameCss,/\.public-tv-frame\[data-portrait-first\] \{[^}]*width:100svh; height:100svw/);
 const fixtures=fs.readFileSync('components/ship/Fixtures.tsx','utf8');
 assert.match(fixtures,/<title>Soul TV<\/title>/);
 assert.match(fixtures,/line\(radio,\[0,\.6,\.1\],\[-\.23,1\.02,\.1\]/);
 assert.match(fixtures,/line\(radio,\[0,\.6,\.1\],\[\.23,1\.02,\.1\]/);
});

test('one mounted iframe and playback/maximise state persist between both TV positions',()=>{
 const h=harness(1280,720,'tv');
 const iframe=()=>nodes(h.tree).filter(n=>n.type==='iframe');
 nodes(h.tree).find(n=>n.props?.className==='space-tv-open').props.onClick();
 const src=iframe()[0].props.src;
 for(const dock of [{x:700,y:450,scale:.5},undefined,{x:350,y:220,scale:.25}]) {
  h.setTvProps({dock});
  assert.equal(h.game.tvExpanded,true);assert.equal(h.game.tvStarted,true);
  assert.equal(iframe().length,1);assert.equal(iframe()[0].props.src,src);assert.equal(iframe()[0].key,null);
 }
 nodes(h.tree).find(n=>n.props?.className?.split(' ').includes('space-tv-close')).props.onClick();
 assert.equal(h.game.tvExpanded,false);assert.equal(h.game.tvStarted,true);
 assert.deepEqual(nodes(h.tree).find(n=>n.type==='aside').props.style.left,350);
 h.setTvProps({});assert.equal(h.game.tvStarted,true);assert.equal(iframe()[0].props.src,src);
 h.unmount();
});
test('console fixture opens the same persistent player through its controller',()=>{
 const h=harness(1280,720,'tv'),controllerRef={current:null};
 h.setTvProps({controllerRef,dock:{x:700,y:450,scale:.5}});
 assert.equal(nodes(h.tree).filter(n=>n.props?.className==='space-tv-open').length,0);
 controllerRef.current.open();
 assert.equal(h.game.tvExpanded,true);assert.equal(h.game.tvStarted,true);
 assert.equal(nodes(h.tree).filter(n=>n.type==='iframe').length,1);
 h.unmount();
});
