import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const { outputText }=ts.transpileModule(fs.readFileSync('app/api/subscribe/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
const configCode=ts.transpileModule(fs.readFileSync('lib/mate/config.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
function route({env={NODE_ENV:'development',MATE_APP_ORIGIN:'http://localhost'},token='test',enabled=false,eligible=true,entry=true,signupError=false,entryError=false,alreadySubscribed=false}={}) {
 const loaded={exports:{}};const calls=[];
 const config={exports:{}};
 new Function('module','exports','process',configCode)(config,config.exports,{env});
 const deps={
  '@/lib/mate/config':{...config.exports,mateConfig:()=>({...config.exports.mateConfig(env),enabled})},
  '@/lib/mate/server':{privateJson:(data,status=200)=>Response.json(data,{status})},
  '@/lib/mate/mailerlite':{normaliseEmail:value=>typeof value==='string'&&value.includes('@')?value:null,eligibleSubscriber:()=>eligible,subscribeMate:async()=>{calls.push('subscribe');if(signupError)throw Error();return {subscriber:{},alreadySubscribed};}},
  '@/lib/mate/recovery':{recoveryFailureDetails:()=>({stage:'fixture'}),requestMateRecovery:async()=>{calls.push('entry');if(entryError)throw Error();return entry;}},
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

test('signup uses the real production validator for both domains and both membership outcomes',async()=>{
 for(const configured of ['https://everyonesanalien.com','https://www.everyonesanalien.com']) {
  for(const origin of ['https://everyonesanalien.com','https://www.everyonesanalien.com']) {
   for(const alreadySubscribed of [false,true]) {
    const api=route({env:{NODE_ENV:'production',MATE_APP_ORIGIN:configured},enabled:true,alreadySubscribed});
    // Internal/proxy URL must not override the explicitly trusted public origin.
    const req=new Request('http://internal-proxy/api/subscribe',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email:alreadySubscribed?'existing@example.test':'new@example.test'})});
    const response=await api.POST(req);
    assert.equal(response.status,200);
    assert.deepEqual(await response.json(),{success:true,alreadySubscribed,entry:'email'});
    assert.deepEqual(api.calls,['subscribe','entry']);
   }
  }
 }
});
test('signup rejects missing, malformed, foreign and spoofed origins before any provider work',async()=>{
 for(const origin of [null,'null','https://foreign.test','http://everyonesanalien.com','https://everyonesanalien.com.evil.test','https://everyonesanalien.com/','https://everyonesanalien.com/path']) {
  const api=route({env:{NODE_ENV:'production',MATE_APP_ORIGIN:'https://everyonesanalien.com'}});
  const headers={'Content-Type':'application/json',Host:'everyonesanalien.com','X-Forwarded-Host':'everyonesanalien.com','X-Forwarded-Proto':'https'};
  if(origin!==null)headers.Origin=origin;
  const response=await api.POST(new Request('https://everyonesanalien.com/api/subscribe',{method:'POST',headers,body:JSON.stringify({email:'new@example.test'})}));
  assert.equal(response.status,403);assert.deepEqual(api.calls,[]);
 }
});
test('configured local origins and newsletter-only same-origin fallback still work',async()=>{
 for(const origin of ['http://localhost:3000','http://127.0.0.1:3000']) {
  for(const configured of [origin,undefined]) {
   const api=route({env:{NODE_ENV:'development',...(configured?{MATE_APP_ORIGIN:configured}:{})}});
   const make=header=>new Request(`${origin}/api/subscribe`,{method:'POST',headers:{Origin:header,'Content-Type':'application/json'},body:JSON.stringify({email:'new@example.test'})});
   assert.equal((await api.POST(make(origin))).status,200);
   assert.equal((await api.POST(make('https://foreign.test'))).status,403);
   assert.deepEqual(api.calls,['subscribe']);
  }
 }
});
