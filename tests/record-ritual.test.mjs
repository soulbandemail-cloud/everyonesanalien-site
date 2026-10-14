import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
function load(file,deps={}){const m={exports:{}};new Function('module','exports','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m,m.exports,n=>deps[n]);return m.exports;}
const records=load('lib/ship/records.ts');
const {recordRitual,stopRecordRitual,ritualFrame,restingGramophone,storage,displaySleeve,tonearmPoint}=load('lib/ship/recordRitual.ts',{'./records':records});
const finish=steps=>ritualFrame(steps,1000).scene;
const etr='experiencing-the-role',magic='the-magic-if';
test('empty, different, same and return album rituals maintain physical state',()=>{
 let scene=restingGramophone();
 for(const [album,index] of [[etr,0],[magic,0],[magic,1],[etr,5]]){
  const old=scene.loadedAlbum,steps=recordRitual(scene,album,index);
  if(old===album){assert.ok(!steps.some(s=>/sleeve|record/.test(s.name)));for(const step of steps){assert.deepEqual(step.to.sleeves,scene.sleeves);assert.deepEqual(step.to.disc,scene.disc);}}
  else{
   const place=steps.find(s=>s.name==='place-record');
   const before=steps.slice(0,steps.indexOf(place)).reduce((a,s)=>a+s.duration,0);
   assert.equal(ritualFrame(steps,before+place.duration*.99).scene.loadedAlbum,null);
   assert.equal(ritualFrame(steps,before+place.duration+.001).scene.loadedAlbum,album);
   if(old)assert.ok(steps.findIndex(s=>s.name==='store-old-sleeve')<steps.findIndex(s=>s.name==='retrieve-sleeve'));
  }
  scene=finish(steps);assert.equal(scene.loadedAlbum,album);assert.equal(scene.disc.album,album);assert.deepEqual(scene.sleeves[album],displaySleeve);
  const other=album===etr?magic:etr;assert.deepEqual(scene.sleeves[other],storage(other));assert.equal(scene.lift,-.002);assert.equal(scene.crank,0);assert.equal(scene.amount,0);
 }
});
test('all scenarios use identical winding and hand follows the knob',()=>{
 const a=recordRitual(restingGramophone(),etr,0),b=recordRitual(finish(a),magic,0),c=recordRitual(finish(b),magic,3);
 for(const steps of [a,b,c]){
  const wind=steps.find(s=>s.wind);assert.equal(wind.duration,2.4);
  const start=steps.slice(0,steps.indexOf(wind)).reduce((n,s)=>n+s.duration,0);
  for(const fraction of [.1,.4,.8]){const pose=ritualFrame(steps,start+wind.duration*fraction).scene;assert.deepEqual(pose.hands[1],records.crankPoint(.15,-.08,-.20,pose.crank));}
 }
});
test('transfers are continuous and same-album needle moves to selected track',()=>{
 const a=recordRitual(restingGramophone(),magic,0),end=finish(a),b=recordRitual(end,magic,4);
 assert.ok(finish(b).tone>end.tone);
 for(const steps of [a,recordRitual(end,etr,2)]){
  let t=0;
  for(const step of steps){
   const before=ritualFrame(steps,t+step.duration-.00001).scene,after=ritualFrame(steps,t+step.duration+.00001).scene;
   for(const id of [etr,magic])for(const corner of ['a','b','c'])for(let i=0;i<3;i++)assert.ok(Math.abs(before.sleeves[id][corner][i]-after.sleeves[id][corner][i])<.001);
   t+=step.duration;
  }
 }
});
test('selection guard rejects repeated taps and completion unlocks without audio',()=>{
 const slots=[];let cursor=0;
 const react={useEffect:()=>{cursor++;},useState:v=>{let i=cursor++;slots[i]??=v;return[slots[i],v=>slots[i]=v];},useRef:v=>{let i=cursor++;return slots[i]??={current:v};},useCallback:f=>{cursor++;return f;}};
 const {useRecords:controller}=load('components/ship/useRecords.ts',{'react':react,'@/lib/ship/records':records,'@/lib/ship/recordPlayback':{RecordPlayback:class{prepare(){} start(){} dispose(){}}}});
 const render=()=>{cursor=0;return controller();};
 render().choose(etr,0);render().choose(magic,0);assert.equal(render().state.selectedAlbum,etr);assert.equal(render().state.revision,1);assert.equal(render().state.loadedAlbum,null);
 render().physical(etr);assert.equal(render().state.busy,true);assert.equal(render().state.playing,false);
 render().physical(etr,true);assert.equal(render().state.completion,1);assert.equal(render().state.busy,false);
 render().choose(magic,1);assert.equal(render().state.revision,2);assert.equal(render().state.loadedAlbum,etr);
});

test('tonearm lift keeps its hinge fixed and opens the post angle to 135 degrees',()=>{
 const pivot=[-.23,1.51,.19],tip=[-.23,1.51,-.24];
 for(const tone of [0,.43,.78]){
  assert.deepEqual(tonearmPoint(pivot,tone,.11),pivot);
  const raised=tonearmPoint(tip,tone,.11),delta=raised.map((v,i)=>v-pivot[i]);
  assert.ok(Math.abs(Math.hypot(...delta)-.43)<1e-10);
  assert.ok(Math.abs(Math.acos(-delta[1]/.43)*180/Math.PI-135)<1e-10);
 }
});

test('right hand holds sleeves, left hand holds vinyl, and unused arms relax',()=>{
 const steps=recordRitual(restingGramophone(),etr,0);
 const retrieve=steps.find(s=>s.name==='retrieve-sleeve');
 assert.equal(retrieve.to.hands[0],null);assert.ok(retrieve.to.hands[1]);
 const place=steps.find(s=>s.name==='place-record');
 assert.ok(place.to.hands[0]);assert.equal(place.to.hands[1],null);
 const wind=steps.find(s=>s.wind);assert.equal(wind.to.hands[0],null);assert.ok(wind.to.hands[1]);
 const change=recordRitual(finish(steps),magic,0);
 assert.ok(change.findIndex(s=>s.name==='take-displayed-sleeve')<change.findIndex(s=>s.name==='reach-record'));
 assert.equal(change.find(s=>s.name==='return-record-to-sleeve').duration,.8);
 const lower=steps.findIndex(s=>s.name==='lower-tonearm');
 assert.equal(steps[lower-2].name,'raise-tonearm');
 assert.equal(steps[lower-2].duration,change.find(s=>s.name==='lift-tonearm').duration);
 assert.equal(steps[lower-1].name,'position-tonearm');
 assert.equal(steps[lower].duration,1);
});

test('opposite-side selection flips the same vinyl through 180 degrees without touching sleeves',()=>{
 const initial=finish(recordRitual(restingGramophone(),etr,1));
 const flip=recordRitual(initial,etr,3),phase=flip.find(s=>s.name==='flip-record');
 assert.equal(phase.to.disc.flip-phase.from.disc.flip,Math.PI);
 for(const step of flip)assert.deepEqual(step.to.sleeves,initial.sleeves);
 assert.ok(!flip.some(s=>s.name.includes('sleeve')));
 const end=finish(flip);assert.equal(end.loadedSide,'B');assert.equal(end.loadedAlbum,etr);
 const back=finish(recordRitual(end,etr,2));assert.equal(back.loadedSide,'A');
 assert.equal(back.disc.flip,Math.PI*2);
 assert.equal(finish(recordRitual(restingGramophone(),magic,4)).loadedSide,'B');
});

test('stop ritual rests the needle with two 0.55s lifts/lowers and leaves vinyl untouched',()=>{
 const initial=finish(recordRitual(restingGramophone(),magic,4)),steps=stopRecordRitual(initial),end=finish(steps);
 assert.deepEqual(steps.map(s=>s.name),['reach-tonearm','lift-tonearm','rest-tonearm','lower-to-rest','settle']);
 assert.equal(steps[1].duration,.55);assert.equal(steps[3].duration,.55);
 assert.equal(end.tone,0);assert.equal(end.lift,0);
 assert.equal(end.loadedSide,'B');assert.deepEqual(end.disc,initial.disc);assert.deepEqual(end.sleeves,initial.sleeves);
});
test('clicking the playing track waits for needle lift to stop, then permits playback again',()=>{
 const slots=[];let cursor=0,update,stops=0,prepares=0,starts=0;
 const react={useEffect:()=>{cursor++;},useState:v=>{let i=cursor++;slots[i]??=v;return[slots[i],v=>slots[i]=v];},useRef:v=>{let i=cursor++;return slots[i]??={current:v};},useCallback:f=>{cursor++;return f;}};
 const {useRecords:controller}=load('components/ship/useRecords.ts',{'react':react,'@/lib/ship/records':records,'@/lib/ship/recordPlayback':{RecordPlayback:class{constructor(publish){update=publish;}prepare(){prepares++;}start(){starts++;}stop(){stops++;update({playing:false});}dispose(){}}}});
 const render=()=>{cursor=0;return controller();};
 render().choose(etr,0);render().physical(etr,true,'A',true);
 // Automatic advancement means the playing song differs from the original selection.
 update({playing:true,currentSong:{album:etr,index:1}});
 render().choose(etr,1);
 assert.equal(render().state.stopping,true);assert.equal(render().state.playing,true);assert.equal(stops,0);assert.equal(prepares,1);
 render().choose(magic,0);assert.equal(render().state.selectedSong.index,1);
 render().physical(etr,false,'A',false,true);assert.equal(stops,1);assert.equal(render().state.playing,false);
 render().physical(etr,true,'A');assert.equal(starts,1);assert.equal(render().state.busy,false);
 render().choose(etr,1);assert.equal(render().state.stopping,false);assert.equal(prepares,2);
});
