import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import path from 'node:path';
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const m={exports:{}};cache.set(file,m.exports);const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;new Function('module','exports','require',code)(m,m.exports,p=>load(path.resolve(path.dirname(file),p+'.ts')));return m.exports;}
const {worldMesh,surfaceBounds,drawSurface,surfaceStats}=load('lib/ship/worldSurface.ts');
const {DEFAULT_DOME}=load('lib/ship/domeGeometry.ts');
test('camera updates reuse GPU geometry and source texture, and return to identical bounds',()=>{
 let uploads=0,textures=0;
 const gl=new Proxy({isContextLost:()=>false,createShader:()=>({}),getShaderParameter:()=>true,createProgram:()=>({}),getProgramParameter:()=>true,createTexture:()=>({}),createBuffer:()=>({}),bufferData:()=>uploads++,texImage2D:()=>textures++,getAttribLocation:()=>0,getUniformLocation:()=>({})},{get:(target,key)=>key in target?target[key]:()=>{}});
 const ctx={clearRect(){},drawImage(){}};
 globalThis.document={createElement:()=>({width:300,height:150,getContext:()=>gl})};globalThis.devicePixelRatio=1;
 const canvas={style:{},width:0,height:0,getContext:()=>ctx};
 const mesh=worldMesh([-1,0,3,1,0,0, 1,0,3,1,1,0, 0,2,3,1,.5,1]),original=mesh.vertices.slice(),view={width:1280,height:720};
 const initial=surfaceBounds(mesh,DEFAULT_DOME,view),image={};
 drawSurface(canvas,mesh,DEFAULT_DOME,view,image);
 const once={uploads,textures};
 for(let i=0;i<=20;i++)drawSurface(canvas,mesh,{...DEFAULT_DOME,camera:{...DEFAULT_DOME.camera,x:Math.sin(i/20*Math.PI)*.6,z:-7+Math.sin(i/20*Math.PI)*1.2}},view,image);
 assert.deepEqual({uploads,textures},once);assert.deepEqual(mesh.vertices,original);assert.equal(surfaceStats.meshUploads,1);assert.equal(surfaceStats.textureUploads,1);
 assert.deepEqual(surfaceBounds(mesh,DEFAULT_DOME,view),initial);
 assert.notDeepEqual(surfaceBounds(mesh,{...DEFAULT_DOME,camera:{...DEFAULT_DOME.camera,x:.6,z:-5.8}},view),initial);
 delete globalThis.document;delete globalThis.devicePixelRatio;
});
test('cached rug plane matches direct world projection throughout an out-and-back camera path',()=>{
 const code=ts.transpileModule(fs.readFileSync('components/ship/WorldPlane.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,m={exports:{}};
 new Function('module','exports','require',code)(m,m.exports,p=>p==='react/jsx-runtime'?{jsx:(type,props)=>({type,props})}:load('lib/ship/domeGeometry.ts'));
 const {project}=load('lib/ship/domeGeometry.ts'),view={width:1280,height:720},origin={x:-2.5,y:-1,z:-1},u={x:.01,y:0,z:0},v={x:0,y:0,z:.01};
 for(let i=0;i<=20;i++){
  const t=Math.sin(i/20*Math.PI),config={...DEFAULT_DOME,pitch:4*t,camera:{x:.6*t,y:2.8,z:-7+1.2*t}};
  const tree=m.exports.WorldPlane({origin,u,v,width:500,height:500,config,view,children:null});
  const matrix=tree.props.children.props.style.transform.slice(9,-1).split(',').map(Number);
  for(const x of [0,100,250,500])for(const y of [0,125,400,500]){
   const w=matrix[3]*x+matrix[7]*y+matrix[15],px=(matrix[0]*x+matrix[4]*y+matrix[12])/w,py=(matrix[1]*x+matrix[5]*y+matrix[13])/w;
   const p=project({x:origin.x+u.x*x+v.x*y,y:origin.y,z:origin.z+u.z*x+v.z*y},config,view);
   assert.ok(Math.abs(px-p.x)<.00001);assert.ok(Math.abs(py-p.y)<.00001);
  }
 }
});
