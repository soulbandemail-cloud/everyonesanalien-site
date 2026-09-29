import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
test('returning to an object restores keyboard access but suppresses its highlight',()=>{
 const code=ts.transpileModule(fs.readFileSync('components/mate/objectInteraction.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 class Element {dataset={}; focused=false; classList={contains:name=>name==='cockpit-interactive-fixture'}; focus(){this.focused=true;}}
 const mod={exports:{}};
 new Function('module','exports','HTMLElement','SVGElement',code)(mod,mod.exports,Element,Element);
 const trigger=new Element();mod.exports.restoreObjectFocus(trigger);
 assert.equal(trigger.focused,true);assert.equal(trigger.dataset.resting,'true');
 assert.doesNotThrow(()=>mod.exports.restoreObjectFocus(null));
});
