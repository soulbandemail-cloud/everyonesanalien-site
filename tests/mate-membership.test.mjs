import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
export function load(file, deps={}, globals={}) {
 const loaded={exports:{}};
 const {outputText}=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 new Function('module','exports','require',...Object.keys(globals),outputText)(loaded,loaded.exports,name=>{if(name==='server-only')return {};if(name in deps)return deps[name];throw Error(`Unexpected import ${name}`);},...Object.values(globals));
 return loaded.exports;
}
const subscriber={email:'mate@example.com',status:'active',groups:[{id:'189432463968175126'}]};
const membership=load('lib/mate/mailerlite.ts');
test('membership requires exact email, active status and the Mate group',()=>{
 assert.equal(membership.normaliseEmail(' MATE@example.com '),'mate@example.com');
 for(const value of [null,{},'bad','a'.repeat(255)+'@x.com'])assert.equal(membership.normaliseEmail(value),null);
 assert.equal(membership.eligibleSubscriber(subscriber,subscriber.email),true);
 for(const record of [null,{...subscriber,email:'other@example.com'},{...subscriber,groups:[]},...['unconfirmed','unsubscribed','bounced','junk'].map(status=>({...subscriber,status}))])assert.equal(membership.eligibleSubscriber(record,subscriber.email),false);
});
test('MailerLite lookup is read-only, encoded, uncached and distinguishes absence from outage',async()=>{
 for(const status of [200,404,429,500]) {
  const calls=[];
  const api=load('lib/mate/mailerlite.ts',{}, {process:{env:{MAILERLITE_API_TOKEN:'secret'}},fetch:async(...args)=>{calls.push(args);return Response.json({data:subscriber},{status});}});
  if(status>=429)await assert.rejects(api.findSubscriber('mate+test@example.com'));
  else assert.deepEqual(await api.findSubscriber('mate+test@example.com'),status===404?null:subscriber);
  assert.equal(calls[0][0],'https://connect.mailerlite.com/api/subscribers/mate%2Btest%40example.com');
  assert.equal(calls[0][1].method,'GET');assert.equal(calls[0][1].body,undefined);assert.equal(calls[0][1].cache,'no-store');
 }
});
test('entry stops all admin/email work for non-Mates and lookup failures',async()=>{
 for(const state of ['mate','absent','wrong-group','outage','admin-error','email-error','not-ready']) {
  const calls=[];
  const entry=load('lib/mate/recovery.ts',{
   './config':{mateConfig:()=>({enabled:true,provisioningReady:state!=='not-ready',origin:'https://site.test'})},
   './mailerlite':{eligibleSubscriber:membership.eligibleSubscriber,findSubscriber:async()=>{calls.push('lookup');if(state==='outage')throw Error();return state==='absent'?null:state==='wrong-group'?{...subscriber,groups:[]}:subscriber;}},
   './admin':{authoriseMate:async()=>{calls.push('admin');if(state==='admin-error')throw Error();}},
   './server':{recoveryClient:async()=>({auth:{resetPasswordForEmail:async (email,args)=>{calls.push({email,...args});return {error:state==='email-error'?Error():null};}}})},
  });
  if(['outage','admin-error','email-error','not-ready'].includes(state))await assert.rejects(entry.requestMateRecovery(subscriber.email));
  else assert.equal(await entry.requestMateRecovery(subscriber.email),state==='mate');
  if(['absent','wrong-group','outage'].includes(state))assert.deepEqual(calls,['lookup']);
  if(state==='not-ready')assert.deepEqual(calls,[]);
  if(state==='admin-error')assert.deepEqual(calls,['lookup','admin']);
  if(state==='mate')assert.deepEqual(calls,['lookup','admin',{email:subscriber.email,redirectTo:'https://site.test/auth/reset-password'}]);
 }
});
test('admin provisioning preserves metadata, paginates and never marks an email confirmed',async()=>{
 for(const state of ['new','existing','page-two','race','lookup-error','create-error','update-error']) {
  const calls=[];let scans=0;
  const existing={id:'user',email:subscriber.email,app_metadata:{other:'keep'}};
  const admin={
   listUsers:async args=>{calls.push(['list',args]);scans++;return {data:{users:state==='page-two'&&scans===1?Array.from({length:1000},()=>({email:'other@example.com'})):['existing','page-two','update-error'].includes(state)||(state==='race'&&scans>1)?[existing]:[]},error:state==='lookup-error'?Error():null};},
   createUser:async args=>{calls.push(['create',args]);return {data:{user:state==='new'?{id:'new'}:null},error:state==='race'?{code:'email_exists'}:state==='create-error'?Error():null};},
   updateUserById:async(...args)=>{calls.push(['update',...args]);return {error:state==='update-error'?Error():null};},
  };
  const api=load('lib/mate/admin.ts',{'@supabase/supabase-js':{createClient:(url,key,options)=>{assert.equal(key,'private');assert.equal(options.auth.persistSession,false);return {auth:{admin}};}}},{process:{env:{SUPABASE_URL:'https://auth.test',SUPABASE_SERVICE_ROLE_KEY:'private'}}});
  if(state.endsWith('error'))await assert.rejects(api.authoriseMate(subscriber.email));else await api.authoriseMate(subscriber.email);
  const created=calls.find(call=>call[0]==='create');if(created)assert.deepEqual(created[1],{email:subscriber.email,email_confirm:false,app_metadata:{mate:true}});
  const updated=calls.find(call=>call[0]==='update');if(updated)assert.deepEqual(updated,['update','user',{app_metadata:{other:'keep',mate:true}}]);
  if(state==='page-two')assert.deepEqual(calls[1],['list',{page:2,perPage:1000}]);
 }
});
test('currentMate continues to work without MailerLite or admin credentials',async()=>{
 const api=load('lib/mate/server.ts',{
  '@supabase/ssr':{createServerClient:()=>({auth:{getUser:async()=>({data:{user:{email_confirmed_at:'today',app_metadata:{mate:true}}},error:null})}})},
  'next/headers':{cookies:async()=>({getAll:()=>[]})},
  './config':{mateConfig:()=>({enabled:true,origin:'https://site.test'}),isMate:user=>Boolean(user?.email_confirmed_at&&user.app_metadata?.mate===true)},
 });
 assert.equal(await api.currentMate(),true);
});
test('MailerLite signup adds only the Mate group without forcing consent or blanking a name',async()=>{
 for(const status of [200,201,422]) {
  const calls=[];
  const api=load('lib/mate/mailerlite.ts',{}, {process:{env:{MAILERLITE_API_TOKEN:'secret'}},fetch:async(...args)=>{calls.push(args);return Response.json({data:subscriber},{status});}});
  if(status===422)await assert.rejects(api.subscribeMate(subscriber.email));
  else assert.deepEqual(await api.subscribeMate(subscriber.email),{subscriber,alreadySubscribed:status===200});
  assert.equal(calls[0][1].method,'POST');
  assert.deepEqual(JSON.parse(calls[0][1].body),{email:subscriber.email,groups:['189432463968175126']});
 }
});
test('recovery errors retain the failing stage and safe provider status/code without leaking private details',async()=>{
 for(const stage of ['membership','provisioning','supabase-recovery']) {
  const providerError={status:429,code:'over_email_send_rate_limit',message:'private email and token',email:'private@example.test',url:'https://private.test/token'};
  const api=load('lib/mate/recovery.ts',{
   './config':{mateConfig:()=>({enabled:true,provisioningReady:true,origin:'https://site.test'})},
   './mailerlite':{eligibleSubscriber:()=>true,findSubscriber:async()=>{if(stage==='membership')throw new Error('lookup',{cause:providerError});return subscriber;}},
   './admin':{authoriseMate:async()=>{if(stage==='provisioning')throw new Error('admin',{cause:providerError});}},
   './server':{recoveryClient:async()=>({auth:{resetPasswordForEmail:async()=>({error:providerError})}})},
  });
  let failure;try{await api.requestMateRecovery(subscriber.email);}catch(error){failure=error;}
  assert.deepEqual(api.recoveryFailureDetails(failure),{stage,status:429,code:'over_email_send_rate_limit'});
  assert.deepEqual(api.recoveryFailureDetails({message:'secret',code:'private@example.test',status:0}),{stage:'unknown'});
 }
});
