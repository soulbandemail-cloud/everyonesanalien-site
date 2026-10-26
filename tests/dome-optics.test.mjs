import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
function load(file,deps={}){const m={exports:{}};new Function('module','exports','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(m,m.exports,n=>deps[n]);return m.exports;}
const geometry=load('lib/ship/domeGeometry.ts');
const {glassReflectance,domeIncidence}=load('lib/ship/domeOptics.ts',{'./domeGeometry':geometry});
test('dielectric reflectance increases towards grazing incidence',()=>{
 assert.ok(Math.abs(glassReflectance(1)-.04)<1e-10);
 assert.equal(glassReflectance(0),1);
 assert.ok(glassReflectance(.3)>glassReflectance(.7));
});
test('sphere-centred eye has head-on incidence everywhere, not a fake screen-edge gradient',()=>{
 const c={...geometry.DEFAULT_DOME,camera:{x:0,y:0,z:0}},sample=domeIncidence(c,{width:844,height:390});
 for(const x of [0,422,844])for(const y of [0,195,390])assert.ok(Math.abs(sample(x,y)-1)<1e-12);
});
test('optics respond to camera translation and remain finite on mobile and desktop',()=>{
 for(const view of [{width:1480,height:930},{width:844,height:390}]){
 const a=domeIncidence(geometry.DEFAULT_DOME,view),b=domeIncidence({...geometry.DEFAULT_DOME,camera:{x:1,y:2.8,z:-7}},view);
 assert.notEqual(a(0,100),b(0,100));
 for(let x=0;x<=view.width;x+=50)for(let y=0;y<=view.height;y+=50){const value=a(x,y);assert.ok(value!==null&&value>=0&&value<=1);}
 }
});
