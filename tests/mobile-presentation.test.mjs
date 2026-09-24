import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const modules=new Map();
function load(name){
 if(modules.has(name))return modules.get(name);
 const m={exports:{}};
 new Function('module','exports','require',ts.transpileModule(fs.readFileSync(`lib/ship/${name}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(m,m.exports,n=>load(n.replace('./','')));
 modules.set(name,m.exports);return m.exports;
}
const g=load('domeGeometry'),m=load('mobilePresentation'),h=load('hullGeometry'),seam=load('hullFloorSeam'),room=load('roomGeometry');
const samples=[{width:844,height:290},{width:667,height:300},{width:915,height:360},{width:812,height:250}];
test('portrait cockpit swivels with entry progress and unrotates when the phone rotates',()=>{
 const portrait={width:390,height:844},landscape={width:844,height:390};
 assert.equal(m.isMobileViewport(portrait,true,5),true);
 assert.equal(m.isMobileViewport(landscape,false,0),false);
 for(const progress of [0,.001,.25,.5,.75,1,.5,0]) {
  const frame=m.cockpitPresentation(portrait,true,false,progress);
  assert.equal(frame.angle,90*progress);
  assert.equal(frame.view.width,390+454*progress);
  assert.equal(frame.view.height,844-454*progress);
  assert.deepEqual(m.cockpitPresentation(landscape,true,true,progress),{view:landscape,angle:0});
  assert.deepEqual(m.cockpitPresentation(portrait,false,false,progress),{view:portrait,angle:0});
 }
 assert.deepEqual(m.cockpitPresentation(portrait,true,false,1).view,landscape);
 const source=fs.readFileSync('components/mate/MateExperience.tsx','utf8');
 assert.doesNotMatch(source,/orientation-gate|Rotate your phone|inert=|requestOrientation/);
 assert.match(source,/data-cockpit-presentation/);
});
test('mobile landscape FOV fits the unmodified sofa with a small left margin',()=>{
 const before=JSON.stringify(g.DEFAULT_DOME);
 for(const view of samples){
  const camera=m.mobileThirdCamera(g.DEFAULT_DOME,view);
  assert.ok(camera.fov<g.DEFAULT_DOME.fov);
  const points=m.sofaBounds(camera).map(p=>g.project(p,camera,view));
  const left=Math.min(...points.map(p=>p.x));
  assert.ok(Math.abs(left-Math.max(8,view.width*.015))<.001);
  assert.ok(points.every(p=>p.visible && Number.isFinite(p.y) && p.x>=0 && p.x<=view.width && p.y>=0 && p.y<=view.height));
  assert.deepEqual(camera.camera,g.DEFAULT_DOME.camera);
 }
 assert.equal(JSON.stringify(g.DEFAULT_DOME),before);
});
test('mobile side groups move laterally and shrink coherently, independent of the physical lens',()=>{
 for(const name of ['live','merch']) {
  const next=m.mobileSideContent(name);
  assert.ok(next.scale<.78);
  for(const view of samples){
   const old=g.domePoint(name==='live'?-.67:.67,.5305,g.DEFAULT_DOME,view);
   const point=g.domePoint(next.theta,.5305,g.DEFAULT_DOME,view);
   assert.ok(name==='live'?point.x<old.x:point.x>old.x);
  }
 }
 const source=fs.readFileSync('components/home/useDomeProjection.ts','utf8');
 assert.match(source,/mobileThird && \(name==='live' \|\| name==='merch'\)/);
 assert.match(source,/side\?\.scale \?\?/);
});
test('mobile floor and hull share all seam samples exactly across aspect ratios and near-plane clipping',()=>{
 for(const view of samples){
  const camera=m.mobileThirdCamera(g.DEFAULT_DOME,view);
  const boundary=seam.hullFloorBoundary(camera);
  const patches=h.hullMesh(camera,h.DEFAULT_HULL,true).slice(0,seam.SEAM_SECTORS);
  for(let i=0;i<boundary.length;i++){
   assert.deepEqual(patches[i].points[0],boundary[i]);
   assert.deepEqual(g.project(patches[i].points[0],camera,view),g.project(boundary[i],camera,view));
   const next=boundary[(i+1)%boundary.length];
   const end=patches[i].points[3];
   assert.ok(Math.hypot(end.x-next.x,end.y-next.y,end.z-next.z)<1e-10);
  }
  for(const pitch of [0,12,-12]){
   const c={...camera,pitch};
   assert.doesNotMatch(room.polygonPath(boundary,c,view),/NaN|Infinity/);
   for(const p of patches)assert.doesNotMatch(room.polygonPath(p.points,c,view),/NaN|Infinity/);
  }
 }
 // The existing desktop geometry remains the default path.
 assert.deepEqual(h.hullMesh(g.DEFAULT_DOME,h.DEFAULT_HULL),h.hullMesh(g.DEFAULT_DOME,h.DEFAULT_HULL,false));
});

test('keyboard-reduced viewport does not override device portrait orientation',()=>{
 const keyboard={width:390,height:270};
 assert.equal(m.viewportLandscape(keyboard,'portrait-primary'),false);
 assert.equal(m.cockpitPresentation(keyboard,true,false,0).angle,0);
 assert.equal(m.viewportLandscape(keyboard,'landscape-primary'),true);
 assert.equal(m.viewportLandscape(keyboard),true);
});

test('viewport hook follows usable viewport and rotation events without reloading, then cleans up',()=>{
 const target=()=>{const events=new Map();return {events,addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name)};};
 const vv={...target(),width:390,height:700,offsetLeft:0,offsetTop:0};
 const orientation={...target(),type:'portrait-primary'};
 const media={...target(),matches:true};
 const win={...target(),innerWidth:390,innerHeight:844,visualViewport:vv,matchMedia:()=>media};
 let state,cleanup,frame,ready=false,observed=false;
 const react={useState:initial=>{state=initial;return [state,fn=>{state=fn(state);}];},useEffect:fn=>{cleanup=fn();}};
 const loaded={exports:{}};
 const code=ts.transpileModule(fs.readFileSync('components/mate/usePresentationViewport.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 new Function('module','exports','require','window','screen','navigator','document','ResizeObserver','requestAnimationFrame','cancelAnimationFrame',code)(loaded,loaded.exports,name=>name==='react'?react:m,win,{orientation},{maxTouchPoints:5},{documentElement:{}},class {observe(){observed=true;}disconnect(){observed=false;}},fn=>{frame=fn;return 1;},()=>{frame=null;});
 loaded.exports.usePresentationViewport(value=>{ready=value;});
 frame();
 assert.equal(ready,true);assert.equal(observed,true);assert.equal(state.mobile,true);
 assert.deepEqual(state.view,{width:390,height:700});assert.equal(state.landscape,false);
 assert.equal(m.cockpitPresentation(state.view,state.mobile,state.landscape,1).angle,90);
 Object.assign(win,{innerWidth:844,innerHeight:390});Object.assign(vv,{width:844,height:290});orientation.type='landscape-primary';
 orientation.events.get('change')();frame();
 assert.deepEqual(state.view,{width:844,height:290});
 assert.equal(m.cockpitPresentation(state.view,state.mobile,state.landscape,1).angle,0);
 vv.height=250;vv.events.get('resize')();frame();assert.equal(state.view.height,250);
 cleanup();assert.equal(observed,false);assert.equal(win.events.size,0);assert.equal(vv.events.size,0);assert.equal(orientation.events.size,0);assert.equal(media.events.size,0);
});

test('live projection applies mobile tuning to whole side groups only and preserves public/desktop layout',()=>{
 const loaded={exports:{}};
 const code=ts.transpileModule(fs.readFileSync('components/home/useDomeProjection.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const deps={'react':{useRef:value=>({current:value}),useLayoutEffect:fn=>fn()},'@/lib/ship/domeGeometry':g,'@/lib/ship/domePageLayout':load('domePageLayout'),'@/lib/ship/mobilePresentation':m,'@/lib/ship/cameraTransition':{cameraDuration:()=>0}};
 new Function('module','exports','require','window','document',code)(loaded,loaded.exports,name=>deps[name],{matchMedia:()=>({addEventListener(){},removeEventListener(){}}),addEventListener(){}},{addEventListener(){}});
 const run=(cockpit,mobileThird)=>{
  const slots=['live','merch'].map(name=>({dataset:{domeSlot:name},style:{},getBoundingClientRect:()=>({width:100,height:100,x:0,y:0}),removeAttribute(){this.style={};}}));
  const root={current:{closest:()=>null,querySelectorAll:selector=>selector==='[data-dome-slot]'?slots:[],classList:{toggle(){},remove(){}}}};
  loaded.exports.useDomeProjection(root,cockpit,g.DEFAULT_DOME,samples[0],false,undefined,undefined,mobileThird);
  return slots.map(el=>el.style);
 };
 const desktop=run(true,false),mobile=run(true,true),publicPage=run(false,false);
 assert.ok(parseFloat(mobile[0].left)<parseFloat(desktop[0].left));
 assert.ok(parseFloat(mobile[1].left)>parseFloat(desktop[1].left));
 for(let i=0;i<2;i++){
  assert.match(desktop[i].transform,/scale\(0.78\)/);assert.match(mobile[i].transform,/scale\(0.6\)/);
  assert.equal(mobile[i].width,desktop[i].width);assert.equal(mobile[i].pointerEvents,undefined);
  assert.deepEqual(publicPage[i],{});
 }
});

test('mobile camera retains the entire flush hatch above the bottom edge',()=>{
 const hatch=room.deckOutline(room.floorPortDiameter,room.floorPortDiameter,room.ROOM.floorY,room.ROOM.port.z);
 for(const view of [...samples,{width:700,height:390},{width:844,height:220}]) {
  const camera=m.mobileThirdCamera(g.DEFAULT_DOME,view);
  for(const point of hatch) {
   const p=g.project(point,camera,view);
   assert.ok(p.visible && p.x>=0 && p.x<=view.width && p.y>=0 && p.y<=view.height-8+.001);
  }
 }
});
