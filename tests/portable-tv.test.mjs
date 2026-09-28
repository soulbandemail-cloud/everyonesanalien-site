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
 nodes(h.tree).find(n=>n.props?.className==='space-tv-screen').props.onPointerDownCapture();
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
 assert.match(mate,/<\/div>\s*{!cockpit && <div className="public-tv-frame/);
 assert.doesNotMatch(fs.readFileSync('components/home/CanonicalHomepage.tsx','utf8'),/PortableTV/);
 const frameCss=fs.readFileSync('components/mate/mate.css','utf8');
 assert.match(frameCss,/\.public-tv-frame \{[^}]*position:fixed;[^}]*inset:0/);
 assert.match(frameCss,/\.public-tv-frame\[data-portrait-first\] \{[^}]*width:100svh; height:100svw/);
 const fixtures=fs.readFileSync('components/ship/Fixtures.tsx','utf8');
 assert.match(fixtures,/TV fixed on the control panel to the alien’s right/);
 assert.match(fixtures,/line\(radio,\[0,\.58,\.1\],\[-\.15,\.98,\.1\]/);
 assert.match(fixtures,/line\(radio,\[0,\.58,\.1\],\[\.15,\.98,\.1\]/);
});
