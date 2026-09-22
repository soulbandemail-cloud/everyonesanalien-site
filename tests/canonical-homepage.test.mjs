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
const panel=component('components/mate/MatePanel.tsx');
const page=component('components/home/CanonicalHomepage.tsx',{'./useDomeProjection':{useDomeProjection:()=>{}},'@/components/mate/MatePanel':panel});
const render=cockpit=>renderToStaticMarkup(React.createElement(page.default,{cockpit,loginEnabled:true,config:{},view:{width:1440,height:900}}));
const links=html=>[...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gs)].map(m=>[m[1],m[2]]);
test('one canonical content tree: public SHOWS/MATES/MERCH, cockpit SHOWS/empty/MERCH',()=>{
 const publicPage=render(false),cockpit=render(true);
 assert.deepEqual(links(cockpit),links(publicPage));
 assert.ok(publicPage.indexOf('UPCOMING SHOWS')<publicPage.indexOf('>MATES<'));
 assert.ok(publicPage.indexOf('>MATES<')<publicPage.indexOf('>MERCH<'));
 assert.match(publicPage,/SIGN UP/);assert.match(publicPage,/LOG IN/);
 assert.doesNotMatch(cockpit,/data-dome-slot="mate"|>MATES<|Get The Hyper-Fix|SIGN UP|LOG IN|<form/);
 for(const html of [publicPage,cockpit]){
  assert.match(html,/data-dome-slot="live" class="md:col-start-1/);
  assert.match(html,/data-dome-slot="merch" class="md:col-start-3/);
 }
 assert.match(publicPage,/footer-alien-head/);assert.doesNotMatch(cockpit,/footer-alien-head|flying-alien-head/);
});
test('inline mode selectors persist and expose only the selected form',()=>{
 for(const mode of ['signup','login']) {
  let stateIndex=0;
  const loaded=component('components/mate/MatePanel.tsx',{'react':{...React,useState:initial=>[stateIndex++===0?mode:initial,()=>{}]}});
  const html=renderToStaticMarkup(React.createElement(loaded.default,{enabled:true}));
  assert.match(html,/SIGN UP/);assert.match(html,/LOG IN/);assert.match(html,/name="email"/);assert.match(html,/>ENTER</);
  assert.doesNotMatch(html,/<dialog/);assert.equal((html.match(/<form/g)||[]).length,1);
  if(mode==='login'){assert.match(html,/name="password"/);assert.match(html,/RESET PASSWORD/);}
  else assert.doesNotMatch(html,/name="password"|RESET PASSWORD/);
 }
});
test('desktop glass projection leaves its centre empty and preserves live links',()=>{
 const elements=['live','merch'].map(name=>({dataset:{domeSlot:name},style:{},getBoundingClientRect:()=>({width:100,x:0,y:0,height:100}),removeAttribute(){}}));
 const root={current:{querySelectorAll:()=>elements,classList:{toggle(){}}}};
 const loaded={exports:{}};
 const {outputText}=ts.transpileModule(fs.readFileSync('components/home/useDomeProjection.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 const deps={'react':{useRef:value=>({current:value}),useLayoutEffect:fn=>fn()},'@/lib/ship/domeGeometry':{domePoint:theta=>({x:theta,y:0})},'@/lib/ship/domePageLayout':{domePageLayout:()=>({information:1})},'@/lib/ship/cameraTransition':{cameraDuration:()=>0}};
 new Function('module','exports','require','window','document',outputText)(loaded,loaded.exports,name=>deps[name],{matchMedia:()=>({addEventListener(){},removeEventListener(){}}),addEventListener(){}},{addEventListener(){}});
 loaded.exports.useDomeProjection(root,true,{}, {width:1440,height:900});
 assert.equal(elements[0].style.left,'-0.67px');assert.equal(elements[1].style.left,'0.67px');
});
