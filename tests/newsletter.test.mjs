import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const { outputText }=ts.transpileModule(fs.readFileSync('app/api/subscribe/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
function route({token='test',enabled=false,eligible=true,entry=true,signupError=false,entryError=false,alreadySubscribed=false}={}) {
 const loaded={exports:{}};const calls=[];
 const deps={
  '@/lib/mate/config':{mateConfig:()=>({enabled,validOrigin:true,origin:'http://localhost'})},
  '@/lib/mate/server':{privateJson:(data,status=200)=>Response.json(data,{status})},
  '@/lib/mate/mailerlite':{normaliseEmail:value=>typeof value==='string'&&value.includes('@')?value:null,eligibleSubscriber:()=>eligible,subscribeMate:async()=>{calls.push('subscribe');if(signupError)throw Error();return {subscriber:{},alreadySubscribed};}},
  '@/lib/mate/entry':{requestMateEntry:async()=>{calls.push('entry');if(entryError)throw Error();return entry;}},
 };
 new Function('module','exports','require','process',outputText)(loaded,loaded.exports,name=>deps[name],{env:{MAILERLITE_API_TOKEN:token}});
 return {...loaded.exports,calls};
}
const request=(origin='http://localhost',email='mate@example.test')=>new Request('http://localhost/api/subscribe',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email})});
test('signup validates origin/email and fails safely without credentials',async()=>{
 const api=route({token:''});assert.equal((await api.POST(request())).status,503);assert.deepEqual(api.calls,[]);
 assert.equal((await route().POST(request('https://evil.test'))).status,403);
 assert.equal((await route().POST(request('http://localhost','invalid'))).status,400);
});
test('newsletter-only mode preserves successful new and existing signup without authentication',async()=>{
 for(const alreadySubscribed of [true,false]) {
  const api=route({alreadySubscribed});const response=await api.POST(request());
  assert.deepEqual(await response.json(),{success:true,alreadySubscribed});assert.deepEqual(api.calls,['subscribe']);assert.equal(response.headers.get('set-cookie'),null);
 }
});
test('signup authenticates only after membership success and preserves partial success for retry',async()=>{
 for(const [options,expected,calls] of [
  [{},'email',['subscribe','entry']],
  [{eligible:false},'pending',['subscribe']],
  [{entryError:true},'retry',['subscribe','entry']],
  [{entry:false},'pending',['subscribe','entry']],
 ]) {
  const api=route({enabled:true,...options});const response=await api.POST(request());
  assert.deepEqual(await response.json(),{success:true,alreadySubscribed:false,entry:expected});assert.deepEqual(api.calls,calls);
 }
 const failed=route({enabled:true,signupError:true});assert.equal((await failed.POST(request())).status,503);assert.deepEqual(failed.calls,['subscribe']);
});
