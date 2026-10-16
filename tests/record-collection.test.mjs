import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
import {nodes} from './helpers/interaction-harness.mjs';
const require=createRequire(import.meta.url);
function load(file,deps={}){const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;new Function('module','exports','require',code)(m,m.exports,n=>deps[n]??require(n));return m.exports;}
const data=load('lib/ship/records.ts');
test('both exact tracklists and cover files are available',()=>{
 assert.deepEqual(data.RECORDS.map(a=>[a.name,...a.tracks]),[['THE MAGIC IF','Merry Go Round','Inside Out','What They Call Love','Daisy Blue','CLOUDS'],['EXPERIENCING THE ROLE','Charlie','Brother','Bruno','Half-Noise','Any Day Now','Cheese']]);
 for(const album of data.RECORDS)assert.ok(fs.existsSync('public'+album.artwork));
});
test('song selection leaves loaded record and playing state independent',()=>{
 const next=data.selectRecordSong(data.INITIAL_RECORD_STATE,'the-magic-if',2);
 assert.equal(next.selectedAlbum,'the-magic-if');assert.deepEqual(next.selectedSong,{album:'the-magic-if',index:2});assert.equal(next.loadedAlbum,null);assert.equal(next.playing,false);
 const playing={...next,loadedAlbum:'experiencing-the-role',playing:true};
 assert.deepEqual(data.selectRecordSong(playing,'the-magic-if',4),{...playing,selectedSong:{album:'the-magic-if',index:4}});
 assert.equal(data.selectRecordSong(next,'the-magic-if',99),next);
});
test('album toggles are exclusive and selection persists after collapsing',()=>{
 let cursor=0;const slots=[];
 const react={useId:()=> 'records',useRef:value=>({current:value}),useLayoutEffect:()=>{},useState:value=>{const i=cursor++;if(!(i in slots))slots[i]=value;return[slots[i],value=>slots[i]=typeof value==='function'?value(slots[i]):value];}};
 const component=load('components/home/RecordCollection.tsx',{'react':react,'@/lib/ship/records':data}).default;
 let record=data.INITIAL_RECORD_STATE;
 const render=()=>{cursor=0;return nodes(component({record,onChoose:(album,index)=>{record=data.selectRecordSong(record,album,index);}}));};
 const albums=()=>render().filter(n=>n.props?.['aria-expanded']!==undefined);
 albums()[0].props.onClick();assert.equal(albums()[0].props['aria-expanded'],true);
 albums()[1].props.onClick();assert.equal(albums()[0].props['aria-expanded'],false);assert.equal(albums()[1].props['aria-expanded'],true);
 render().find(n=>n.props?.['aria-label']==='Select CLOUDS preview').props.onClick();
 albums()[1].props.onClick();assert.ok(albums().every(n=>!n.props['aria-expanded']));
 assert.equal(render().find(n=>n.props?.['aria-label']==='Select CLOUDS preview').props['aria-pressed'],true);
});
test('crank rotates around its front-facing pivot without changing its radius',()=>{
 assert.deepEqual(data.crankPoint(0,0,0,1),[...data.CRANK_PIVOT]);
 for(const angle of [0,Math.PI/2,Math.PI,2*Math.PI]){const p=data.crankPoint(-.23,-.16,-.12,angle);assert.ok(Math.abs(Math.hypot(p[0]-data.CRANK_PIVOT[0],p[1]-data.CRANK_PIVOT[1])-Math.hypot(.23,.16))<1e-10);}
});
