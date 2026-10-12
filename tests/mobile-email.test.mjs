import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
import {nodes} from './helpers/interaction-harness.mjs';
const require=createRequire(import.meta.url);
function panel(mobile=true){
 let cursor=0,blurred=0,calls=[];const state=[];
 let resolve,reject;
 const react={useRef:value=>state[cursor++]??={current:value},useState:value=>{const i=cursor++;if(!(i in state))state[i]=value;return [state[i],value=>{state[i]=value;}];}};
 const mod={exports:{}};
 const code=ts.transpileModule(fs.readFileSync('components/mate/MatePanel.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const Overlay=()=>null;
 new Function('module','exports','require','fetch',code)(mod,mod.exports,name=>name==='react'?react:name==='./MobileEmailOverlay'?{default:Overlay}:require(name),(...args)=>{calls.push(args);return new Promise((yes,no)=>{resolve=yes;reject=no;});});
 const render=()=>{cursor=0;return nodes(mod.exports.default({mobile}));};
 const event={preventDefault(){},currentTarget:{querySelector:()=>({blur(){blurred++;}})}};
 return {render,event,calls,blurred:()=>blurred,respond:(body,ok=true)=>resolve({ok,json:async()=>body}),fail:()=>reject(Error('offline')),Overlay};
}
test('mobile email is a button; only the opened portrait overlay contains the form',()=>{
 const h=panel();let tree=h.render();
 assert.equal(tree.some(n=>n.type==='input'),false);
 const entry=tree.find(n=>n.props?.['aria-haspopup']==='dialog');assert.ok(entry);entry.props.onClick();
 tree=h.render();assert.ok(tree.some(n=>n.type===h.Overlay));
 assert.equal(tree.filter(n=>n.type==='form').length,1);
 assert.equal(tree.find(n=>n.type==='input').props.enterKeyHint,'go');
 assert.equal(tree.find(n=>n.type==='input').props.autoFocus,undefined);
 tree.find(n=>n.type===h.Overlay).props.onClose();assert.equal(h.render().some(n=>n.type==='input'),false);
});
test('desktop retains inline email/ENTER and no overlay entry point',()=>{
 const tree=panel(false).render();assert.ok(tree.some(n=>n.type==='input'));
 assert.equal(tree.find(n=>n.type==='button').props.children,'ENTER');
 assert.equal(tree.some(n=>n.props?.['aria-haspopup']==='dialog'),false);
});
test('button and keyboard share one guarded handler; responses remain in the open overlay',async()=>{
 for(const [body,ok,message] of [[{success:true},true,'Welcome aboard!'],[{success:true,alreadySubscribed:true},true,"You're already a Mate, mate"],[{pending:true,message:'Please confirm your email'},true,'Please confirm your email'],[{error:'Invalid email'},false,'Invalid email']]){
  const h=panel();h.render().find(n=>n.props?.['aria-haspopup']).props.onClick();
  h.render().find(n=>n.type==='input').props.onChange({target:{value:'mate@example.test'}});
  const tree=h.render(),form=tree.find(n=>n.type==='form'),button=tree.find(n=>n.props?.type==='submit');
  assert.equal(button.props.onClick,undefined,'native submit button and Return both use onSubmit');
  const first=form.props.onSubmit(h.event);await form.props.onSubmit(h.event);
  assert.equal(h.calls.length,1);assert.equal(h.calls[0][0],'/api/subscribe');assert.equal(h.blurred(),1);
  assert.equal(h.render().find(n=>n.props?.type==='submit').props.disabled,true);
  h.respond(body,ok);await first;
  assert.equal(h.render().find(n=>n.props?.role==='status').props.children,message);
  assert.ok(h.render().some(n=>n.type===h.Overlay));
  assert.equal(h.render().find(n=>n.props?.type==='submit').props.disabled,false);
 }
});
test('failed request unlocks submission and reports the existing connection message',async()=>{
 const h=panel();h.render().find(n=>n.props?.['aria-haspopup']).props.onClick();
 const pending=h.render().find(n=>n.type==='form').props.onSubmit(h.event);h.fail();await pending;
 assert.equal(h.render().find(n=>n.props?.role==='status').props.children,'Unable to connect. Please try again.');
 assert.equal(h.render().find(n=>n.props?.type==='submit').props.disabled,false);
});
