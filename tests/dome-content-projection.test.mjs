import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
function load(file,require=()=>{}){const mod={exports:{}};new Function('module','exports','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(mod,mod.exports,require);return mod.exports;}
const geometry=load('lib/ship/domeGeometry.ts');
const {domeContentMap}=load('lib/ship/domeContentProjection.ts',()=>geometry);
for(const view of [{width:1480,height:930},{width:844,height:390}]){
 test(`sphere chart stays finite, symmetric and unfolded at ${view.width}`,()=>{
  const map=domeContentMap(geometry.DEFAULT_DOME,view);
  for(let y=0;y<=view.height*.65;y+=20)for(let x=0;x<=view.width;x+=20){
   const p=map(x,y),mirror=map(view.width-x,y),right=map(x+.1,y),down=map(x,y+.1);
   assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
   assert.ok(Math.abs(p.x+mirror.x-view.width)<.01);
   assert.ok((right.x-p.x)*(down.y-p.y)-(right.y-p.y)*(down.x-p.x)>0);
  }
 });
 test(`local distortion changes with position and camera at ${view.width}`,()=>{
  const map=domeContentMap(geometry.DEFAULT_DOME,view),y=view.height*.3;
  const centre=map(view.width/2,y),side=map(view.width*.1,y);
  assert.ok(Math.abs(centre.y-side.y)>2);
  const moved=domeContentMap({...geometry.DEFAULT_DOME,camera:{x:0,y:3.5,z:-5},pitch:4},view);
  assert.notDeepEqual(moved(100,y),map(100,y));
 });
}
