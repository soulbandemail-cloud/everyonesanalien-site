import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
function load(file, deps={}) {
 const loaded={exports:{}};
 const {outputText}=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 new Function('module','exports','require',outputText)(loaded,loaded.exports,name=>{if(name in deps)return deps[name];throw new Error(`Unexpected import ${name}`);});
 return loaded.exports;
}
const {mateConfig,isMate}=load('lib/mate/config.ts');
const configured={SUPABASE_URL:'https://test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'test',MATE_APP_ORIGIN:'https://example.com',MATE_AUTH_ENABLED:'true'};
test('production gate is closed by default and requires valid explicit configuration',()=>{
 assert.equal(mateConfig({}).enabled,false);
 assert.equal(mateConfig({...configured,NODE_ENV:'production'}).enabled,false);
 assert.equal(mateConfig({...configured,NODE_ENV:'production',MATE_PUBLIC_LOGIN_ENABLED:'true'}).enabled,true);
 assert.equal(mateConfig({...configured,NODE_ENV:'production',MATE_PUBLIC_LOGIN_ENABLED:'true',MATE_APP_ORIGIN:'http://example.com'}).enabled,false);
 assert.equal(mateConfig({...configured,NODE_ENV:'development',MATE_APP_ORIGIN:'http://127.0.0.1:3000'}).enabled,true);
});
test('Mate access requires confirmed identity and admin-controlled membership',()=>{
 assert.equal(isMate(null),false);
 assert.equal(isMate({email_confirmed_at:'today',user_metadata:{mate:true}}),false);
 assert.equal(isMate({app_metadata:{mate:true}}),false);
 assert.equal(isMate({email_confirmed_at:'today',app_metadata:{mate:true}}),true);
});
const request=(body,origin='https://example.com')=>new Request('https://example.com/api/mate/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
function routes(file,{enabled=true,providerError=null,mate=true,fail=false}={}) {
 const calls=[];
 const client={auth:{signInWithPassword:async args=>{calls.push(args);return {data:{user:{email_confirmed_at:'today',app_metadata:{mate}},session:providerError?null:{}},error:providerError};},signOut:async()=>{if(fail)throw Error('network');calls.push('signed-out');return {error:providerError};}}};
 const deps={
  '@/lib/mate/mailerlite':{normaliseEmail:value=>typeof value==='string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? value.trim().toLowerCase() : null},
  '@/lib/mate/config':{mateConfig:()=>({enabled,origin:'https://example.com'}),isMate,sameOrigin:req=>req.headers.get('Origin')==='https://example.com'},
  '@/lib/mate/server':{mateClient:async()=>client,privateJson:(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}}),clearMateCookies:async()=>calls.push('cleared'),currentMate:async()=>{if(fail)throw Error('network');return mate;}},
 };
 return {...load(file,deps),calls};
}
test('password login validates inputs, rejects non-Mates and never sends an email',async()=>{
 const file='app/api/mate/login/route.ts';
 const input={email:'mate@example.com',password:'a-password'};
 assert.equal((await routes(file,{enabled:false}).POST(request(input))).status,404);
 assert.equal((await routes(file).POST(request(input,'https://evil.test'))).status,403);
 assert.equal((await routes(file).POST(request({...input,email:'invalid'}))).status,400);
 assert.equal((await routes(file).POST(request({email:input.email}))).status,400);
 const ok=routes(file);assert.deepEqual(await (await ok.POST(request(input))).json(),{authenticated:true});
 assert.deepEqual(ok.calls,[input]);
 const nonMate=routes(file,{mate:false}),badPassword=routes(file,{providerError:{status:400}});
 const a=await nonMate.POST(request(input)),b=await badPassword.POST(request(input));
 assert.equal(a.status,401);assert.equal(b.status,401);assert.deepEqual(await a.json(),await b.json());
 assert.equal(nonMate.calls.at(-1),'signed-out');
});
test('logout only succeeds after provider logout, rejecting CSRF and preserving retry on failure',async()=>{
 const file='app/api/mate/logout/route.ts';
 assert.equal((await routes(file).POST(request({},'https://evil.test'))).status,403);
 const ok=routes(file);assert.equal((await ok.POST(request({}))).status,200);assert.deepEqual(ok.calls,['signed-out','cleared']);
 const failure=routes(file,{fail:true});assert.equal((await failure.POST(request({}))).status,503);assert.deepEqual(failure.calls,[]);
});
test('session endpoint distinguishes signed-out state from provider failures',async()=>{
 const file='app/api/mate/session/route.ts';
 assert.deepEqual(await (await routes(file,{mate:false}).GET()).json(),{authenticated:false});
 assert.equal((await routes(file,{fail:true}).GET()).status,503);
});

test('hosted preview login does not require public launch and cannot open the production site',()=>{
 const preview={...configured,NODE_ENV:'production',VERCEL_ENV:'preview',MATE_PREVIEW_LOGIN_ENABLED:'true'};
 assert.equal(mateConfig(preview).enabled,true);
 assert.equal(mateConfig({...preview,VERCEL_ENV:'production'}).enabled,false);
 assert.equal(mateConfig({...preview,VERCEL_ENV:undefined}).enabled,false);
 assert.equal(mateConfig({...preview,MATE_APP_ORIGIN:'https://everyonesanalien.com'}).enabled,false);
 assert.equal(mateConfig({...preview,MATE_APP_ORIGIN:'https://www.everyonesanalien.com'}).enabled,false);
 assert.equal(mateConfig({...preview,MATE_PREVIEW_LOGIN_ENABLED:'false'}).enabled,false);
 assert.equal(mateConfig({...preview,SUPABASE_PUBLISHABLE_KEY:''}).enabled,false);
});
