import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const require=createRequire(import.meta.url);
function component(file,deps={}) {
 const loaded={exports:{}};
 const {outputText}=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}});
 new Function('module','exports','require',outputText)(loaded,loaded.exports,name=>name in deps?deps[name]:require(name));
 return loaded.exports;
}
const lifecycle=component('components/home/useScopedLifecycle.ts');
const tvHook=component('components/home/usePortableTv.ts',{'./useScopedLifecycle':lifecycle});
const tv=component('components/home/PortableTV.tsx',{'./usePortableTv':tvHook});
const rules=component('components/home/WishRules.tsx');
const wishes=component('components/home/DomeWishes.tsx',{'./useScopedLifecycle':lifecycle,'./WishRules':rules,'./wishes.css':{}});
const panel=component('components/mate/MatePanel.tsx');
const geometry=component('lib/ship/domeGeometry.ts');
const layout=component('lib/ship/domePageLayout.ts',{'./domeGeometry':geometry});
const wordmark=component('lib/ship/wordmarkGeometry.ts',{'./domePageLayout':layout});
const heart=component('components/home/RealPlanetHeart.tsx',{'@/lib/ship/wordmarkGeometry':wordmark});
const room=component('lib/ship/roomGeometry.ts',{'./domeGeometry':geometry});
const transition=component('lib/ship/cameraTransition.ts',{'./roomGeometry':room});
const exterior=component('lib/ship/exteriorSpace.ts',{'./domeGeometry':geometry,'./cameraTransition':transition});
const space=component('components/home/ExteriorSpace.tsx',{'./exterior.css':{},'@/lib/ship/domeGeometry':geometry,'@/lib/ship/exteriorSpace':exterior});
const page=component('components/home/CanonicalHomepage.tsx',{'@/lib/ship/domeGeometry':geometry,'./ExteriorSpace':space,'@/lib/ship/exteriorSpace':exterior,'./DomeWishes':wishes,'./PortableTV':tv,'./RealPlanetHeart':heart,'./useDomeProjection':{useDomeProjection:()=>{}},'@/components/mate/MatePanel':panel});
const render=cockpit=>renderToStaticMarkup(React.createElement(page.default,{cockpit,loginEnabled:true,config:geometry.DEFAULT_DOME,view:{width:1440,height:900}}));
const links=html=>[...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gs)].map(m=>[m[1],m[2]]);
test('one canonical content tree: public SHOWS/MATES/THE MERCH, cockpit SHOWS/empty/THE MERCH',()=>{
 const publicPage=render(false),cockpit=render(true);
 assert.deepEqual(links(cockpit),links(publicPage));
 assert.ok(publicPage.indexOf('THE SHOWS')<publicPage.indexOf('>THE MATES<'));
 assert.ok(publicPage.indexOf('>THE MATES<')<publicPage.indexOf('>THE MERCH<'));
 assert.match(publicPage,/SIGN UP/);assert.match(publicPage,/LOG IN/);
 assert.doesNotMatch(cockpit,/data-dome-slot="mate"|>THE MATES<|Get The Hyper-Fix|SIGN UP|LOG IN|<form/);
 for(const html of [publicPage,cockpit]){
  assert.match(html,/data-dome-slot="live" class="md:col-start-1/);
  assert.match(html,/<a[^>]*class="[^"]*bg-\[#00082d\][^"]*active:bg-\[#6ee7b7\][^"]*"[^>]*>The George Tavern,/);
  assert.match(html,/data-dome-slot="merch" class="md:col-start-3/);
 }
 for(const html of [publicPage,cockpit]) {
  assert.equal((html.match(/data-world-object="planet-heart"/g)||[]).length,1);
  assert.match(html,/<h1[^>]*aria-label="SOUL"/);
  assert.doesNotMatch(html,/orbital-ring/);
 }
 for (const html of [publicPage,cockpit]) assert.doesNotMatch(html,/footer-alien-head|flying-alien-head|ufo-tractor-beam|wish-box|saucer-hull-strip|flashbang|wombo-combo/);
 assert.match(publicPage,/shooting-star-launch/); assert.match(publicPage,/star-5/);
 const source=fs.readFileSync('components/home/CanonicalHomepage.tsx','utf8');
 assert.doesNotMatch(source,/useState|setInterval|addEventListener|ArcadeGame|minigameEnabled/);
});
test('inline mode selectors persist and expose only the selected form',()=>{
 for(const mode of ['signup','login']) {
  let stateIndex=0;
  const loaded=component('components/mate/MatePanel.tsx',{'react':{...React,useState:initial=>[stateIndex++===0?mode:initial,()=>{}]}});
  const html=renderToStaticMarkup(React.createElement(loaded.default,{enabled:true}));
  assert.match(html,/SIGN UP/);assert.match(html,/LOG IN/);assert.match(html,/name="email"/);assert.match(html,/>ENTER</);
  assert.doesNotMatch(html,/<dialog/);assert.equal((html.match(/<form/g)||[]).length,1);
  const actions=[...html.matchAll(/<button\b([^>]*)>(SIGN UP|LOG IN|ENTER)<\/button>/g)];
  assert.equal(actions.length,3);
  for(const [,attrs] of actions){
   assert.match(attrs,/bg-\[#00082d\]/);
   assert.match(attrs,/hover:bg-\[#6ee7b7\]/);
   assert.match(attrs,/border-white/);assert.match(attrs,/disabled:opacity-50/);
  }
  const selected=actions.find(([,attrs])=>attrs.includes('aria-pressed="true"'));
  assert.ok(selected);assert.match(selected[1],/aria-pressed:bg-\[#6ee7b7\]/);
  assert.match(html,/<button class="[^"]*bg-\[#00082d\][^"]*">ENTER<\/button>/);
  if(mode==='login'){assert.match(html,/name="password"/);assert.match(html,/RESET PASSWORD/);}
  else {
   assert.doesNotMatch(html,/name="password"|RESET PASSWORD/);
   assert.match(html,/<button class="[^"]*bg-\[#00082d\][^"]*">ENTER<\/button>/);
  }
 }
});
test('desktop glass projection leaves its centre empty and preserves live links',()=>{
 const elements=['live','merch'].map(name=>({dataset:{domeSlot:name},style:{},getBoundingClientRect:()=>({width:100,x:0,y:0,height:100}),removeAttribute(){}}));
 const root={current:{closest:()=>null,querySelectorAll:selector=>selector.includes("h1")?[]:elements,classList:{toggle(){},remove(){}}}};
 const loaded={exports:{}};
 const {outputText}=ts.transpileModule(fs.readFileSync('components/home/useDomeProjection.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 const deps={'react':{useRef:value=>({current:value}),useLayoutEffect:fn=>fn()},'@/lib/ship/domeGeometry':{domePoint:theta=>({x:theta,y:0})},'@/lib/ship/domePageLayout':{domePageLayout:()=>({information:1})},'@/lib/ship/cameraTransition':{cameraDuration:()=>0},'@/lib/ship/mobilePresentation':{mobileSideContent:()=>({theta:0,scale:.6})}};
 new Function('module','exports','require','window','document',outputText)(loaded,loaded.exports,name=>deps[name],{matchMedia:()=>({addEventListener(){},removeEventListener(){}}),addEventListener(){}},{addEventListener(){}});
 loaded.exports.useDomeProjection(root,true,{}, {width:1440,height:900});
 assert.equal(elements[0].style.left,'-0.67px');assert.equal(elements[1].style.left,'0.67px');
});

test('public atmosphere stays intact and Wish UI/rules are absent before a catch',()=>{
 const html=render(false);
 assert.match(html,/class="stars"/);
 assert.equal((html.match(/class="shooting-star /g)||[]).length,11);
 assert.doesNotMatch(html,/aria-label="Wish Rules"|wish-rules-box|MAKE A WISH|Rule 1:/);
 assert.doesNotMatch(render(true),/wish-rules-box|wish-box/);
 assert.match(render(true),/exterior-shooting-inactive/);
 assert.match(render(true),/class="stars"/);
 const rulesSource=fs.readFileSync('components/home/WishRules.tsx','utf8');
 assert.doesNotMatch(rulesSource,/useState|useEffect|onClick|onPointer|setInterval|ArcadeGame/);
});

test('MATES reserves its destination but remains hidden until reverse projection completes',()=>{
 for(const progress of [1,.75,.25,.001,0]) {
  const html=renderToStaticMarkup(React.createElement(page.default,{cockpit:false,progress,loginEnabled:true,config:geometry.DEFAULT_DOME,view:{width:1440,height:900}}));
  assert.equal((html.match(/data-dome-slot="mate"/g)||[]).length,1);
  assert.equal(html.includes('data-returning="true"'),progress>0);
 }
 const css=fs.readFileSync('components/home/exterior.css','utf8');
 assert.match(css,/\[data-returning\] \[data-dome-slot="mate"\] \{ visibility:hidden; opacity:0; pointer-events:none/);
 assert.match(css,/:not\(\[data-returning\]\) \[data-dome-slot="mate"\].*animation:mate-arrival/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});

test('real planet ring has isolated SVG halos, crisp white cores and unique instance IDs',()=>{
 const html=renderToStaticMarkup(React.createElement('div',null,React.createElement(heart.default),React.createElement(heart.default)));
 const filters=[...html.matchAll(/<filter id="([^"]+)"([^>]*)>(.*?)<\/filter>/gs)];
 assert.equal(filters.length,2);assert.notEqual(filters[0][1],filters[1][1]);
 for(const [ ,id,attrs,contents] of filters) {
  assert.match(attrs,/filterUnits="userSpaceOnUse"/);
  assert.match(attrs,/x="-200" y="-150" width="400" height="300"/);
  assert.match(attrs,/color-interpolation-filters="sRGB"/);
  assert.deepEqual([...contents.matchAll(/stdDeviation="([^"]+)"/g)].map(x=>x[1]),['10','12','24']);
  assert.deepEqual([...contents.matchAll(/flood-opacity="([^"]+)"/g)].map(x=>x[1]),['.90','.65','.32']);
  assert.equal((contents.match(/flood-color="rgb\(255,176,255\)"/g)||[]).length,3);
  assert.match(contents,/<feMergeNode in="SourceGraphic"><\/feMergeNode><\/feMerge>$/);
  const rings=[...html.matchAll(/<path data-ring="(?:rear|front)"[^>]+>/g)].map(x=>x[0]).filter(x=>x.includes(`filter="url(#${id})"`));
  assert.equal(rings.length,2);
  for(const ring of rings){assert.match(ring,/stroke="white"/);assert.match(ring,/stroke-width="9"/);}
 }
 const planetPaths=[...html.matchAll(/<path[^>]*fill="url\(#[^"]+\)"[^>]*>/g)];
 assert.equal(planetPaths.length,2);
 for(const [path] of planetPaths)assert.doesNotMatch(path,/filter=/);
 assert.doesNotMatch(fs.readFileSync('components/home/exterior.css','utf8'),/\.planet-letter-ring\s*\{/);
});
