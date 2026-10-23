import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const emotes={exports:{}};
new Function('module','exports',ts.transpileModule(fs.readFileSync('lib/ship/charlieEmotes.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(emotes,emotes.exports);
const ambient={exports:{}};
new Function('module','exports',ts.transpileModule(fs.readFileSync('lib/ship/charlieAmbient.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(ambient,ambient.exports);
const loaded={exports:{}};
new Function('module','exports','require',ts.transpileModule(fs.readFileSync('lib/ship/alienVolume.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(loaded,loaded.exports,name=>name.includes('charlieAmbient')?ambient.exports:emotes.exports);
const {alienVolume}=loaded.exports;
test('alien retains head volume at front, quarter, side and rear angles',()=>{
 for(const yaw of [0,45,90,135,180,225,270,315]){
  const mesh=alienVolume(yaw,0);
  const head=mesh.flatMap(f=>[...f.d.matchAll(/(-?\d+\.\d+),(-?\d+\.\d+)/g)].map(m=>({x:+m[1],y:+m[2]}))).filter(p=>p.y>40&&p.y<130);
  assert.ok(Math.max(...head.map(p=>p.x))-Math.min(...head.map(p=>p.x))>80);
  assert.ok(mesh.every(f=>! /NaN|Infinity/.test(f.d)));
  assert.ok(mesh.every((f,i)=>i===0||f.depth>=mesh[i-1].depth));
 }
});
test('head pitch stays finite across the full up/down nod range',()=>{
 for(const yaw of [0,90,180,270]) for(const down of [-1,-.5,0,.5,1]) assert.ok(alienVolume(yaw,down).every(f=>! /NaN|Infinity/.test(f.d)));
});

test('look direction uses opposite, continuous 3D turns for left and right',()=>{
 const {alienLookYaw}=loaded.exports;
 for(const back of [0,.25,.5,.75,1]){
  assert.ok(alienLookYaw(-.8,back)>0);
  assert.ok(alienLookYaw(.8,back)<0);
  assert.ok(Math.abs(alienLookYaw(-.8,back)+alienLookYaw(.8,back))<1e-8);
 }
 assert.equal(Math.abs(alienLookYaw(0,0)),0);
 for(const x of [-1,-.5,.5,1])for(let b=.001;b<=1;b+=.001)assert.ok(Math.abs(alienLookYaw(x,b)-alienLookYaw(x,b-.001))<1);
});

test('head nod is capped at both ends even with out-of-range input',()=>{
 for(const yaw of [0,90,180,270]){
  assert.deepEqual(alienVolume(yaw,-3),alienVolume(yaw,-1));
  assert.deepEqual(alienVolume(yaw,3),alienVolume(yaw,1));
 }
});

test('full downward nod requires bottom centre and falls off exponentially sideways',()=>{
 const {alienNodTarget:nod}=loaded.exports;
 assert.equal(nod(0,1),1);
 assert.equal(nod(0,.5),0);
 for(const y of [.6,.75,.9,.99])assert.ok(nod(0,y)<1);
 for(const x of [.1,.25,.5,1]){
  assert.equal(nod(x,1),nod(-x,1));
  assert.ok(Math.abs(nod(x,1)-Math.exp(-4*x*x))<1e-12);
  assert.ok(nod(x,.8)<nod(0,.8));
 }
 assert.ok(nod(.5,.8)*45<11); // Lounge-area cursor does not force a groundward stare.
 assert.equal(nod(0,0),-1);
});

test('camera-facing range includes the whole head and turns away only above antennae',()=>{
 const {alienFacingTarget:facing}=loaded.exports;
 for(const antenna of [.35,.55,.7]){
  for(const y of [antenna,antenna+.02,antenna+.1,1])assert.equal(facing(y,antenna,.12),1);
  assert.equal(facing(antenna-.13,antenna,.12),0);
  assert.ok(Math.abs(facing(antenna-.06,antenna,.12)-.5)<1e-12);
 }
});

test('centre-line front/back transitions swivel through side views without snapping',()=>{
 const {advanceAlienYaw:advance}=loaded.exports;
 for(const [start,target] of [[180,0],[0,180],[179,-179]]){
  let yaw=start;const samples=[];
  for(let i=0;i<180;i++){
   const next=advance(yaw,target,1/60);
   assert.ok(Math.abs(next-yaw)<=4.000001);
   yaw=next;samples.push(yaw);
  }
  assert.ok(Math.abs(Math.sin((yaw-target)*Math.PI/360))<.001);
  if(Math.abs(start-target)===180)assert.ok(samples.some(y=>Math.abs(Math.abs(y)-90)<5));
 }
});

test('secondary motion stays subtle, preserves planted feet and keeps reading pages in front',()=>{
 const points=mesh=>mesh.flatMap(f=>[...f.d.matchAll(/(-?\d+\.\d+),(-?\d+\.\d+)/g)].map(m=>({x:+m[1],y:+m[2]})));
 const baseline=points(alienVolume(0,0,true,{stand:1,moving:0,life:0}));
 const floor=Math.max(...baseline.map(p=>p.y));
 for(const life of [1,3,7,13]){
  const mesh=alienVolume(0,0,true,{stand:1,moving:0,life}),p=points(mesh);
  assert.equal(Math.max(...p.map(v=>v.y)),floor);
  assert.ok(mesh.every(f=>! /NaN|Infinity/.test(f.d)));
  assert.ok(Math.abs(Math.min(...p.map(v=>v.y))-Math.min(...baseline.map(v=>v.y)))<2);
  const reading=alienVolume(35,.16,false,{reading:1,life});
  assert.ok(reading.some(f=>f.depth>900));
  assert.ok(reading.every((f,i)=>i===0||f.depth>=reading[i-1].depth));
 }
});

test('all ambient poses render finite connected surfaces across camera angles',()=>{
 for(const kind of ['look','scratch','stretch','shift','recline','fullStretch'])for(const yaw of [0,90,180])for(const time of [0,.7,1.4,2.2,3.1,4.3]){
  const mesh=alienVolume(yaw,0,kind==='fullStretch',{ambient:{kind,amount:Math.min(1,time),time,side:1,variant:2}});
  assert.ok(mesh.every(f=>! /NaN|Infinity/.test(f.d)));
 }
});

test('seated gaze uses projected antennae and pedestal, then rises towards foreground',()=>{
 const {seatedGaze}=loaded.exports;
 for(const scale of [.6,1,1.7]){
  const landmarks={pilotX:640*scale,antennaY:420*scale,chairBaseY:590*scale,alienHeight:160*scale,viewportHeight:800*scale};
  const gaze=(x,y)=>seatedGaze(x*scale,y*scale,landmarks);
  assert.equal(gaze(640,420).back,1);
  assert.equal(gaze(640,320).back,0);
  assert.equal(gaze(640,590).down,1);
  assert.ok(Math.abs(gaze(640,800).down-.12)<1e-10);
  assert.ok(gaze(640,700).down<gaze(640,620).down);
  assert.ok(gaze(640,540).down<gaze(640,590).down);
  assert.ok(gaze(870,560).x>.95);
  assert.equal(gaze(410,560).x,-gaze(870,560).x);
  for(let y=320;y<425;y+=.1)assert.ok(Math.abs(gaze(800,y+.1).back-gaze(800,y).back)<.002);
 }
});

test('seated swivel follows an unsaturated, distance-sensitive direction across the parapet',()=>{
 const {seatedGaze,alienLookYaw}=loaded.exports;
 const landmarks={pilotX:640,antennaY:410,chairBaseY:525,alienHeight:110,viewportHeight:720};
 const angle=(x,y)=>{const g=seatedGaze(x,y,landmarks);return Math.atan2(g.x*.55,1)*180/Math.PI;};
 // Normal cockpit projection: plant, arcade, telescope, mousehole, gramophone, rail.
 const targets=[[135,565],[375,485],[450,465],[850,508],[965,510],[1160,540]];
 const angles=targets.map(([x,y])=>angle(x,y));
 assert.ok(angles.slice(0,3).every(a=>a< -50));
 assert.ok(angles.slice(3).every(a=>a>70));
 for(let i=1;i<3;i++)assert.ok(angles[i]-angles[i-1]>3);
 for(let i=4;i<6;i++)assert.ok(angles[i]-angles[i-1]>1);
 assert.ok(angles[5]>80);
 let previous=angle(100,520);
 for(let x=102;x<=1180;x+=2){const next=angle(x,520);assert.ok(next>previous);assert.ok(next-previous<3);previous=next;}
 assert.ok(angle(900,700)<angle(900,525));
 const g=seatedGaze(850,508,landmarks);
 assert.equal(g.back,1);
 assert.ok(Math.abs(alienLookYaw(g.x,g.back))>90); // stays in the camera-side hemisphere
});

test('outer seated swivel turns towards camera without changing side anchor calibration',()=>{
 const {seatedGaze,alienLookYaw}=loaded.exports;
 const base={pilotX:640,antennaY:410,chairBaseY:525,alienHeight:110,viewportHeight:720};
 const landmarks={...base,leftAnchorX:450,rightAnchorX:850};
 const turn=(x,y)=>{const g=seatedGaze(x,y,landmarks);return 180-Math.abs(alienLookYaw(g.x,g.back,g.swivel));};
 for(const x of [450,640,850]){
  const before=seatedGaze(x,508,base),after=seatedGaze(x,508,landmarks);
  assert.equal(after.swivel,0);assert.equal(after.x,before.x);assert.equal(after.down,before.down);
 }
 for(const targets of [[[450,465],[375,485],[270,480],[260,620],[135,565]],[[850,508],[965,510],[1160,540]]]){
  let previousCorrection=-1;
  for(const [x,y] of targets){
   const g=seatedGaze(x,y,landmarks),correction=Math.abs(g.swivel);
   assert.ok(correction>previousCorrection);previousCorrection=correction;
   const original=180-Math.abs(alienLookYaw(g.x,g.back));
   assert.ok(turn(x,y)<=original); // additional rotation is towards the camera
  }
  const last=targets.at(-1);assert.ok(turn(...last)<60);
 }
 for(const side of [-1,1]){
  let previous=turn(640,520);
  for(let offset=1;offset<540;offset++){const next=turn(640+side*offset,520);assert.ok(Math.abs(next-previous)<2);previous=next;}
 }
 assert.equal(seatedGaze(1160,300,landmarks).swivel,0);
});

test('blinks preserve resting geometry and remain finite through seated and moving poses',()=>{
 for(const stand of [0,1])for(const yaw of [0,90,180,270]){
  const motion={stand,moving:stand,gait:1.3};
  assert.deepEqual(alienVolume(yaw,0,false,motion),alienVolume(yaw,0,false,{...motion,blink:0}));
  for(const blink of [.3,.8,1])assert.ok(alienVolume(yaw,.2,false,{...motion,blink}).every(f=>!/NaN|Infinity/.test(f.d)));
 }
 const open=alienVolume(180,0),closed=alienVolume(180,0,false,{blink:1});
 assert.ok(closed.length<open.length); // covered eye cells disappear, head surface stays intact
 assert.deepEqual(open.filter(f=>f.fill!=='#000000'),closed.filter(f=>f.fill!=='#000000'));
});
