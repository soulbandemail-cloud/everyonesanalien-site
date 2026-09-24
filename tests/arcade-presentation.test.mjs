import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const loaded={exports:{}};
new Function('module','exports','window',ts.transpileModule(fs.readFileSync('components/arcade/presentation.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(loaded,loaded.exports,{innerWidth:1280,innerHeight:720});
const {portraitFrame,arcadePoint,arcadeRect,arcadeSize}=loaded.exports;
test('mobile arcade keeps the same portrait dimensions across phone rotation; desktop stays landscape',()=>{
 assert.deepEqual(portraitFrame(390,844,true),{width:390,height:844,rotated:false});
 assert.deepEqual(portraitFrame(844,390,true),{width:390,height:844,rotated:true});
 assert.deepEqual(portraitFrame(1280,720,false),{width:1280,height:720,rotated:false});
});
test('rotated touch and collision rectangles map back to the same portrait game space',()=>{
 const frame={dataset:{arcadeRotated:'true',arcadeWidth:'390',arcadeHeight:'844'},getBoundingClientRect:()=>({left:10,top:20,right:854,bottom:410})};
 const root={closest:()=>frame};
 assert.deepEqual(arcadePoint(root,{x:854,y:20}),{x:0,y:0});
 assert.deepEqual(arcadePoint(root,{x:10,y:410}),{x:390,y:844});
 assert.deepEqual(arcadePoint(root,{x:654,y:120}),{x:100,y:200});
 assert.deepEqual(arcadeRect(root,{getBoundingClientRect:()=>({left:614,top:120,right:654,bottom:152})}),{left:100,top:200,right:132,bottom:240,width:32,height:40});
 assert.deepEqual(arcadeSize(root),{width:390,height:844});
 frame.dataset.arcadeRotated='false';
 assert.deepEqual(arcadePoint(root,{x:110,y:220}),{x:100,y:200});
 assert.deepEqual(arcadePoint(null,{x:110,y:220}),{x:110,y:220});
 assert.deepEqual(arcadeSize(null),{width:1280,height:720});
});
