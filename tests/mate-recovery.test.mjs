import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
function load(file,deps={},globals={}) {
 const loaded={exports:{}};
 const {outputText}=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}});
 new Function('module','exports','require',...Object.keys(globals),outputText)(loaded,loaded.exports,name=>{if(name in deps)return deps[name];return require(name);},...Object.values(globals));
 return loaded.exports;
}
const origin='https://site.test';
const user={email:'mate@example.com',email_confirmed_at:'today',app_metadata:{mate:true}};
const isMate=value=>Boolean(value?.email_confirmed_at&&value?.app_metadata?.mate===true);
const configuration={enabled:true,origin,url:'https://auth.test',key:'public'};
const config={mateConfig:()=>configuration,isMate,sameOrigin:req=>req.headers.get('origin')===origin};
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
const request=(body,from=origin)=>new Request(`${origin}/api/mate/password`,{method:'POST',headers:{Origin:from,'Content-Type':'application/json'},body:JSON.stringify(body)});
const password={password:'new-password',confirmPassword:'new-password'};
function routes({mate=true,exchangeError=false,type='recovery',saveError=false,loginError=false}={}) {
 const calls=[];
 const recovery={auth:{
  exchangeCodeForSession:async(code,options)=>{calls.push(['exchange',code,options]);return {data:{redirectType:type},error:exchangeError?Error():null};},
  getUser:async()=>({data:{user:mate?user:{...user,app_metadata:{}}},error:null}),
  updateUser:async args=>{calls.push(['save',args]);return {error:saveError?Error():null};},
 }};
 const server={privateJson:json,recoveryClient:async()=>recovery,clearRecoveryCookies:async()=>calls.push('clear-recovery'),mateClient:async()=>({auth:{signInWithPassword:async args=>{calls.push(['login',args]);return {data:{user,session:loginError?null:{}},error:loginError?Error():null};}}})};
 return {session:load('app/api/mate/recovery/session/route.ts',{'@/lib/mate/config':config,'@/lib/mate/server':server}),password:load('app/api/mate/password/route.ts',{'@/lib/mate/config':config,'@/lib/mate/server':server}),calls};
}
test('recovery code exchange returns only readiness, never a redirect or cockpit login',async()=>{
 const api=routes();const response=await api.session.POST(request({code:'one-time',flowId:'abcdefgh'}));
 assert.deepEqual(await response.json(),{ready:true});assert.equal(response.headers.get('location'),null);
 assert.deepEqual(api.calls,[['exchange','one-time',{flowId:'abcdefgh'}]]);
 assert.deepEqual(await (await api.session.GET()).json(),{ready:true});
});
test('recovery rejects missing/expired/replayed/wrong-type and non-Mate sessions',async()=>{
 for(const options of [{exchangeError:true},{type:'signup'},{mate:false}]){
  const api=routes(options);assert.equal((await api.session.POST(request({code:'bad'}))).status,401);
  assert.equal(api.calls.at(-1),'clear-recovery');assert.ok(!api.calls.some(call=>Array.isArray(call)&&call[0]==='login'));
 }
 assert.equal((await routes().session.POST(request({}))).status,401);
 assert.equal((await routes().session.POST(request({code:'code'},'https://evil.test'))).status,403);
 assert.equal((await routes({mate:false}).session.GET()).status,401);
});
test('password save validates confirmation, recovery identity and CSRF before any write',async()=>{
 for(const [body,from,status] of [[{...password,confirmPassword:'different'},origin,400],[{password:'short'},origin,400],[password,'https://evil.test',403]]){
  const api=routes();assert.equal((await api.password.POST(request(body,from))).status,status);assert.deepEqual(api.calls,[]);
 }
 const api=routes({mate:false});assert.equal((await api.password.POST(request(password))).status,401);assert.deepEqual(api.calls,[]);
});
test('cockpit login happens strictly after successful password update',async()=>{
 const api=routes();assert.deepEqual(await (await api.password.POST(request(password))).json(),{success:true});
 assert.deepEqual(api.calls,[['save',{password:password.password}],['login',{email:user.email,password:password.password}],'clear-recovery']);
 const failed=routes({saveError:true});assert.equal((await failed.password.POST(request(password))).status,400);assert.deepEqual(failed.calls,[['save',{password:password.password}]]);
 const retry=routes({loginError:true});assert.equal((await retry.password.POST(request(password))).status,503);
});
test('ordinary session and recovery cookies stay isolated, HttpOnly, and logout clears both',async()=>{
 const jar=new Map();const options=[];
 const api=load('lib/mate/server.ts',{'./config':config,'next/headers':{cookies:async()=>({getAll:()=>[...jar].map(([name,value])=>({name,value})),set:(name,value)=>jar.set(name,value),delete:name=>jar.delete(name)})},'@supabase/ssr':{createServerClient:(url,key,opts)=>{
  options.push(opts);
  const name=opts.cookieOptions.name;
  return {auth:{getUser:async()=>({data:{user:jar.has(name)?user:null},error:null}),exchangeCodeForSession:async()=>opts.cookies.setAll([{name,value:'recovery-token',options:opts.cookieOptions}])}};
 }}});
 const client=await api.recoveryClient();await client.auth.exchangeCodeForSession('code');
 assert.equal(await api.currentMate(),false,'recovery must not satisfy ordinary access');
 assert.equal(options[0].cookieOptions.name,'eaa-mate-recovery');assert.equal(options[0].cookieOptions.httpOnly,true);assert.equal(options[0].cookieOptions.secure,true);
 jar.set('eaa-mate','password-login-token');assert.equal(await api.currentMate(),true);
 jar.set('eaa-mate-recovery.0','chunk');jar.set('eaa-mate-recovery-flow-abcdefgh-code-verifier','verifier');jar.set('unrelated','keep');
 await api.clearMateCookies();assert.deepEqual([...jar],[['unrelated','keep']]);
});
test('reset requests use a generic response for eligible, absent and failed-provider outcomes',async()=>{
 const results=[];
 for(const outcome of ['eligible','absent','outage']){
  const route=load('app/api/mate/recovery/route.ts',{'@/lib/mate/config':config,'@/lib/mate/server':{privateJson:json},'@/lib/mate/mailerlite':{normaliseEmail:value=>value?.includes('@')?value:null},'@/lib/mate/recovery':{recoveryFailureDetails:()=>({stage:'fixture'}),requestMateRecovery:async()=>{if(outcome==='outage')throw Error();return outcome==='eligible';}}});
  const response=await route.POST(request({email:user.email}));results.push({status:response.status,body:await response.json()});
 }
 assert.deepEqual(results[0],results[1]);assert.deepEqual(results[0],results[2]);
});
// Exercise the actual page's effects/submit handler with a small hook harness.
// Strict Mode repeats the effect; navigation must remain absent until a successful save.
function pageHarness(saveOK=true) {
 const state=[];const refs=[];let index=0,refIndex=0;const effects=[];const calls=[];
 const window={location:{search:'?code=one-use&sb_flow_id=abcdefgh',href:'/auth/reset-password?code=one-use'},history:{state:{},replaceState(_s,_t,url){calls.push(['history',url]);}}};
 const react={useState:initial=>{const i=index++;if(!(i in state))state[i]=initial;return [state[i],value=>{state[i]=value;}];},useRef:initial=>{const i=refIndex++;return refs[i]??=( {current:initial});},useEffect:fn=>effects.push(fn)};
 const page=load('app/auth/reset-password/page.tsx',{'react':react},{window,fetch:async(path,options)=>{calls.push([path,options]);return json(path.endsWith('/session')?{ready:true}:saveOK?{success:true}:{error:'Rejected'},path.endsWith('/session')||saveOK?200:400);}}).default;
 return {state,effects,calls,window,render(){index=0;refIndex=0;return page();}};
}
function find(node,predicate){if(!node||typeof node!=='object')return null;if(predicate(node))return node;for(const child of [node.props?.children].flat(Infinity)){const result=find(child,predicate);if(result)return result;}return null;}
test('reset page exchanges once under repeated effects, shows both fields, stays put on failure, then navigates only after save',async()=>{
 for(const saveOK of [false,true]) {
  const harness=pageHarness(saveOK);harness.render();harness.effects[0]();harness.effects[0]();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(harness.calls.filter(call=>call[0]==='/api/mate/recovery/session').length,1);
  assert.equal(harness.window.location.href,'/auth/reset-password?code=one-use');
  let tree=harness.render();assert.ok(find(tree,node=>node.props?.placeholder==='PASSWORD'));assert.ok(find(tree,node=>node.props?.placeholder==='CONFIRM PASSWORD'));
  find(tree,node=>node.props?.placeholder==='PASSWORD').props.onChange({target:{value:password.password}});
  find(tree,node=>node.props?.placeholder==='CONFIRM PASSWORD').props.onChange({target:{value:password.password}});
  tree=harness.render();await find(tree,node=>node.type==='form').props.onSubmit({preventDefault(){}});
  assert.equal(harness.window.location.href,saveOK?'/?mate_entry=1':'/auth/reset-password?code=one-use');
  const save=harness.calls.find(call=>call[0]==='/api/mate/password');assert.deepEqual(JSON.parse(save[1].body),password);
 }
});
test('installed Supabase SSR SDK keeps PKCE recovery out of the ordinary session through password completion',async()=>{
 const {createServerClient}=require('@supabase/ssr');
 const jar=new Map();const providerCalls=[];
 const session={access_token:`${Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')}.${Buffer.from(JSON.stringify({sub:'fixture-user',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.fixture`,refresh_token:'fixture-refresh',token_type:'bearer',expires_in:3600,user:{...user,id:'fixture-user'}};
 const provider=async(input,init)=>{
  const url=new URL(input);providerCalls.push([url.pathname,url.search,init?.method]);
  if(url.pathname.endsWith('/recover'))return json({});
  if(url.pathname.endsWith('/token'))return json(session);
  if(url.pathname.endsWith('/user'))return json(session.user);
  throw Error(`Unexpected mocked provider request: ${url.pathname}`);
 };
 const server=load('lib/mate/server.ts',{'./config':config,'next/headers':{cookies:async()=>({getAll:()=>[...jar].map(([name,value])=>({name,value})),set:(name,value,opts)=>{if(opts?.maxAge===0)jar.delete(name);else jar.set(name,value);},delete:name=>jar.delete(name)})},'@supabase/ssr':{createServerClient}},{fetch:provider});
 const client=await server.recoveryClient();
 const sent=await client.auth.resetPasswordForEmail(user.email,{redirectTo:`${origin}/auth/reset-password`});assert.equal(sent.error,null);
 assert.ok([...jar.keys()].some(name=>name.startsWith('eaa-mate-recovery')&&name.endsWith('code-verifier')));
 const sessionRoute=load('app/api/mate/recovery/session/route.ts',{'@/lib/mate/config':config,'@/lib/mate/server':server});
 const exchanged=await sessionRoute.POST(request({code:'fixture-code'}));assert.equal(exchanged.status,200);
 assert.equal(await server.currentMate(),false);
 const passwordRoute=load('app/api/mate/password/route.ts',{'@/lib/mate/config':config,'@/lib/mate/server':server});
 const saved=await passwordRoute.POST(request(password));assert.equal(saved.status,200);
 assert.equal(await server.currentMate(),true);
 assert.ok(![...jar.keys()].some(name=>name.startsWith('eaa-mate-recovery')));
 const saveIndex=providerCalls.findIndex(([path,,method])=>path.endsWith('/user')&&method==='PUT');
 const loginIndex=providerCalls.findIndex(([,query])=>query.includes('grant_type=password'));
 assert.ok(saveIndex>=0&&loginIndex>saveIndex);
});
