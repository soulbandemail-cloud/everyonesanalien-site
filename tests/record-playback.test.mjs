import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
function load(file,deps={}){const m={exports:{}};new Function('module','exports','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m,m.exports,n=>deps[n]);return m.exports;}
const records=load('lib/ship/records.ts');
const {RecordPlayback}=load('lib/ship/recordPlayback.ts',{'./records':records});
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function setup(t,fail=false){
 const nodes=[],requests=[],updates=[];
 const context={state:'suspended',currentTime:0,destination:{},resume(){this.state='running';return Promise.resolve();},close(){return Promise.resolve();},decodeAudioData:async()=>({duration:10}),createBufferSource(){const node={buffer:null,start(at){this.at=at;},connect(){},disconnect(){},stop(){this.stopped=true;}};nodes.push(node);return node;}};
 const engine=new RecordPlayback(v=>updates.push({...v}),()=>context,async url=>{requests.push(url);return{ok:!fail,arrayBuffer:async()=>new ArrayBuffer(0)};});
 t.after(()=>engine.dispose());
 return{engine,context,nodes,requests,updates,get state(){return updates.at(-1);},end(){const node=nodes.find(n=>n.onended&&!n.ended);assert.ok(node);node.ended=true;context.currentTime=node.at+node.buffer.duration;node.onended();}};
}
for(const [album,index,expected] of [['experiencing-the-role',0,[0,1,2]],['experiencing-the-role',1,[1,2]],['the-magic-if',1,[1,2]],['the-magic-if',4,[4]],['the-magic-if',3,[3,4]]])test(`side playback ${album} ${index} stops at boundary`,async t=>{
 const h=setup(t);assert.equal(h.requests.length,0);h.engine.prepare({album,index});assert.equal(h.context.state,'running');await flush();assert.equal(h.nodes.length,0);
 await h.engine.start();await flush();
 const heard=[];
 for(const track of expected){heard.push(h.state.currentSong.index);assert.equal(heard.at(-1),track);h.end();await flush();}
 assert.deepEqual(heard,expected);assert.equal(h.state.playing,false);assert.equal(h.state.endedSide,true);assert.equal(h.state.position,10);
 assert.equal(h.nodes.length,expected.length);for(let i=1;i<h.nodes.length;i++)assert.equal(h.nodes[i].at,h.nodes[i-1].at+10);
 assert.equal(h.requests.length,expected.length);
});
test('a replacement cancels both current and scheduled audio, with no late duplicate start',async t=>{
 const h=setup(t);h.engine.prepare({album:'experiencing-the-role',index:0});await h.engine.start();await flush();assert.equal(h.nodes.length,2);
 h.engine.prepare({album:'the-magic-if',index:4});assert.ok(h.nodes.every(n=>n.stopped));assert.equal(h.state.playing,false);
 await h.engine.start();await h.engine.start();assert.equal(h.nodes.length,3);assert.equal(h.state.currentSong.index,4);
});
test('missing file clears the spinner and exposes a retry without another ritual',async t=>{
 const h=setup(t,true);h.engine.prepare({album:'the-magic-if',index:4});await h.engine.start();assert.ok(h.state.error);assert.equal(h.state.loading,false);assert.equal(h.nodes.length,0);
});
test('blocked audio can be retried from a gesture without repeating physical preparation',async t=>{
 const h=setup(t);h.engine.prepare({album:'the-magic-if',index:4});await flush();h.context.state='suspended';await h.engine.start();assert.match(h.state.error,/enable audio/);
 h.engine.retry();await flush();assert.equal(h.state.playing,true);assert.equal(h.nodes.length,1);
});
test('all eleven supplied files map to an existing full recording',()=>{
 for(const album of records.RECORDS)for(let index=0;index<album.tracks.length;index++)assert.ok(fs.statSync('public'+records.songFile({album:album.id,index})).size>1000000);
});
