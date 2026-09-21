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
 const client={auth:{signInWithOtp:async args=>{calls.push(args);return {error:providerError};},signOut:async()=>{if(fail)throw Error('network');return {error:providerError};}}};
 const deps={
  '@/lib/mate/config':{mateConfig:()=>({enabled,origin:'https://example.com'}),sameOrigin:req=>req.headers.get('Origin')==='https://example.com'},
  '@/lib/mate/server':{mateClient:async()=>client,privateJson:(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}}),clearMateCookies:async()=>calls.push('cleared'),currentMate:async()=>{if(fail)throw Error('network');return mate;}},
 };
 return {...load(file,deps),calls};
}
test('login is gated, validates origin/email, does not sign up users or enumerate accounts',async()=>{
 const file='app/api/mate/login/route.ts';
 assert.equal((await routes(file,{enabled:false}).POST(request({email:'mate@example.com'}))).status,404);
 assert.equal((await routes(file).POST(request({email:'mate@example.com'},'https://evil.test'))).status,403);
 assert.equal((await routes(file).POST(request({email:'invalid'}))).status,400);
 const known=routes(file),unknown=routes(file,{providerError:{status:400}});
 const a=await known.POST(request({email:'mate@example.com'})),b=await unknown.POST(request({email:'unknown@example.com'}));
 assert.deepEqual(await a.json(),await b.json());
 assert.equal(known.calls[0].options.shouldCreateUser,false);
 assert.equal(known.calls[0].options.emailRedirectTo,'https://example.com/auth/callback');
 assert.equal(a.headers.get('cache-control'),'private, no-store');
 assert.equal((await routes(file,{providerError:{status:429}}).POST(request({email:'mate@example.com'}))).status,503);
});
test('logout only succeeds after provider logout, rejecting CSRF and preserving retry on failure',async()=>{
 const file='app/api/mate/logout/route.ts';
 assert.equal((await routes(file).POST(request({},'https://evil.test'))).status,403);
 const ok=routes(file);assert.equal((await ok.POST(request({}))).status,200);assert.deepEqual(ok.calls,['cleared']);
 const failure=routes(file,{fail:true});assert.equal((await failure.POST(request({}))).status,503);assert.deepEqual(failure.calls,[]);
});
test('session endpoint distinguishes signed-out state from provider failures',async()=>{
 const file='app/api/mate/session/route.ts';
 assert.deepEqual(await (await routes(file,{mate:false}).GET()).json(),{authenticated:false});
 assert.equal((await routes(file,{fail:true}).GET()).status,503);
});

test('callback rejects failed verification/non-Mates and ignores arbitrary redirect targets',async()=>{
 for(const state of ['valid','invalid','non-mate']) {
  let cleared=false;
  const handler=load('app/auth/callback/route.ts',{
   'next/server':{NextResponse:{redirect:(url,init)=>new Response(null,{...init,status:307,headers:{...init.headers,Location:url.toString()}})}},
   '@/lib/mate/config':{mateConfig:()=>({enabled:true,origin:'https://example.com'}),isMate},
   '@/lib/mate/server':{
    clearMateCookies:async()=>{cleared=true;},
    mateClient:async()=>({auth:{exchangeCodeForSession:async()=>({error:state==='invalid'?Error('bad code'):null}),getUser:async()=>({data:{user:{email_confirmed_at:'today',app_metadata:{mate:state!=='non-mate'}}}}),signOut:async()=>({error:null})}}),
   },
  });
  const response=await handler.GET(new Request('https://example.com/auth/callback?code=test&next=https://evil.test'));
  assert.equal(response.headers.get('location'),state==='valid'?'https://example.com/?mate_entry=1':'https://example.com/?mate_error=1');
  assert.equal(cleared,state!=='valid');
 }
});
