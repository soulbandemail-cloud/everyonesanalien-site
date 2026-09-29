import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {createRequire} from 'node:module';
import {nodes} from './helpers/interaction-harness.mjs';
const require=createRequire(import.meta.url);
function fixtureHarness(){
 let pressed=null;const cache=new Map();
 const react={memo:fn=>fn,useId:()=> 'fixture-test',useState:()=>[pressed,value=>{pressed=value;}]};
 function load(file){
  if(file.endsWith('.css'))return {default:{fixtures:'fixtures'}};
  if(cache.has(file))return cache.get(file);
  const mod={exports:{}};
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  new Function('module','exports','require',code)(mod,mod.exports,name=>{
   if(name==='react')return react;
   if(name.startsWith('@/'))return load(name.slice(2)+'.ts');
   if(name.startsWith('.'))return load(path.join(path.dirname(file),name)+(name.endsWith('.css')?'':'.ts'));
   return require(name);
  });cache.set(file,mod.exports);return mod.exports;
 }
 const {Fixtures}=load('components/ship/Fixtures.tsx'),{DEFAULT_DOME}=load('lib/ship/domeGeometry.ts');
 let tv=0,arcade=0;
 const render=(enabled=true)=>Fixtures({config:DEFAULT_DOME,view:{width:1280,height:720},onTV:enabled?()=>tv++:undefined,onArcade:enabled?()=>arcade++:undefined,liveTv:true});
 return {render,counts:()=>({tv,arcade})};
}
test('TV and arcade use identical press/release and cancellation behaviour',()=>{
 for(const [name,id] of [['Maximise TV','tv'],['Play SOUL arcade','arcade']]){
  const h=fixtureHarness();const button=()=>nodes(h.render()).find(n=>n.props?.['aria-label']===name);
  let captured=false;const target={setPointerCapture(){captured=true;},hasPointerCapture(){return captured;}};
  button().props.onPointerDown({button:0,pointerId:1,currentTarget:target});
  assert.equal(button().props['data-pressed'],true);assert.equal(h.counts()[id],0);
  button().props.onPointerLeave({pointerId:1,currentTarget:target});assert.equal(button().props['data-pressed'],true);
  button().props.onPointerUp();assert.equal(button().props['data-pressed'],undefined);
  button().props.onClick();assert.equal(h.counts()[id],1);
  button().props.onPointerDown({button:0,pointerId:1,currentTarget:target});button().props.onPointerCancel();assert.equal(button().props['data-pressed'],undefined);
  button().props.onKeyDown({key:' ',preventDefault(){}});assert.equal(h.counts()[id],1);assert.equal(button().props['data-pressed'],true);
  button().props.onKeyUp({key:' ',preventDefault(){}});assert.equal(h.counts()[id],2);assert.equal(button().props['data-pressed'],undefined);
  button().props.onKeyDown({key:'Enter',preventDefault(){}});button().props.onBlur();button().props.onKeyUp({key:'Enter',preventDefault(){}});assert.equal(h.counts()[id],2);
  const disabled=nodes(h.render(false)).find(n=>n.props?.['aria-label']===name);
  assert.equal(disabled.props.tabIndex,-1);assert.equal(disabled.props.onClick,undefined);
 }
});
test('mint outline follows the complete SVG alpha silhouette, with equal hover/press scaling',()=>{
 const tree=fixtureHarness().render();const all=nodes(tree);
 assert.equal(all.filter(n=>n.type==='filter').length,1);
 assert.ok(all.some(n=>n.type==='feGaussianBlur' && n.props.in==='SourceAlpha' && n.props.stdDeviation==='2.5'));
 assert.ok(all.some(n=>n.type==='feComponentTransfer' && n.props.in==='softSilhouette' && n.props.result==='expanded'));
 assert.ok(all.some(n=>n.type==='feFuncA' && n.props.slope==='12' && n.props.intercept==='-1.5'));
 assert.ok(!all.some(n=>n.type==='feMorphology'),'avoid square dilation corners');
 assert.ok(all.some(n=>n.type==='feFlood' && n.props.floodColor==='#6ee7b7'));
 const tv=all.find(n=>n.props?.['aria-label']==='Maximise TV');
 assert.ok(nodes(tv).filter(n=>n.type==='path').length>=6,'body and both antenna paths are inside the filtered group');
 const css=fs.readFileSync('components/mate/mate.css','utf8');
 assert.match(css,/cockpit-interactive-fixture[^\n]*scale\(1.25\)[^\n]*filter:var/);
 assert.match(css,/cockpit-interactive-fixture\[data-pressed\][^\n]*scale\(\.9\)[^\n]*filter:none/);
 assert.doesNotMatch(css,/\.space-tv:not\(\.space-tv-expanded\):is\(:hover/);
});
