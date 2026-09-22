import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const require=createRequire(import.meta.url);
const loaded={exports:{}};
const {outputText}=ts.transpileModule(fs.readFileSync('components/home/CanonicalHomepage.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}});
new Function('module','exports','require',outputText)(loaded,loaded.exports,name=>{
 if(name==='./useDomeProjection')return {useDomeProjection:()=>{}};
 if(name==='@/components/mate/MateLogin')return {MateLogin:()=>null};
 return require(name);
});
const render=cockpit=>renderToStaticMarkup(React.createElement(loaded.exports.default,{cockpit,loginEnabled:false,config:{},view:{width:1440,height:900}}));
const content=html=>({
 headings:[...html.matchAll(/<h[12][^>]*>(.*?)<\/h[12]>/gs)].map(m=>m[1]),
 links:[...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gs)].map(m=>[m[1],m[2]]),
});
test('public and cockpit render exactly the same canonical headings, links and signup form',()=>{
 const publicPage=render(false),cockpit=render(true);
 assert.deepEqual(content(cockpit),content(publicPage));
 for(const page of [publicPage,cockpit]) {
  assert.match(page,/BECOME A MATE/);
  assert.match(page,/name="email"/);
  assert.equal((page.match(/<form\b/g)||[]).length,1);
 }
 assert.match(publicPage,/footer-alien-head/);
 assert.doesNotMatch(cockpit,/footer-alien-head|flying-alien-head/);
});
