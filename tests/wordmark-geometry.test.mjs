import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const modules=new Map();
function load(name){
 if(modules.has(name))return modules.get(name);
 const m={exports:{}};
 new Function('module','exports','require',ts.transpileModule(fs.readFileSync(`lib/ship/${name}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(m,m.exports,n=>load(n.replace('./','')));
 modules.set(name,m.exports);return m.exports;
}
const g=load('domeGeometry'),w=load('wordmarkGeometry'),layout=load('domePageLayout');
const glyphs=[
 {width:34,height:80,points:[{x:3,y:25},{x:10,y:20},{x:28,y:22},{x:30,y:50},{x:23,y:64},{x:2,y:61}]},
 {width:35,height:80,points:[{x:2,y:21},{x:31,y:21},{x:31,y:53},{x:23,y:64},{x:10,y:64},{x:2,y:53}]},
 {width:34,height:80,points:[{x:3,y:21},{x:9,y:21},{x:9,y:58},{x:31,y:58},{x:31,y:64},{x:3,y:64}]},
];
const close=(a,b)=>assert.ok(Math.abs(a-b)<.001,`${a} ≠ ${b}`);
test('planet ring bounds are the rotated stroked ellipse, not its transparent SVG box',()=>{
 const b=w.ringBounds([1,0,0,1,0,0],1);
 close(b.left,0);close(b.right,w.PLANET_INK.right-w.PLANET_INK.left);
 assert.ok(b.right<200);assert.ok(w.PLANET_INK.top>-75 && w.PLANET_INK.bottom<75);
 const angle=w.RING.angle,points=[];
 for(let i=0;i<4000;i++){
  const t=i/4000*Math.PI*2,x=w.RING.rx*Math.cos(t),y=w.RING.ry*Math.sin(t);
  points.push(x*Math.cos(angle)-y*Math.sin(angle));
 }
 close(w.PLANET_INK.right,Math.max(...points)+w.RING.stroke/2);
});
test('one centred wordmark and exactly equal visible gaps throughout both directions of camera motion',()=>{
 for(const view of [{width:1440,height:900},{width:390,height:700},{width:320,height:568},{width:844,height:290},{width:667,height:300},{width:915,height:360}]){
  for(const progress of [0,.001,.05,.25,.5,.75,.95,1,.75,.25,0]) {
   const camera=g.DEFAULT_DOME;
   const f=w.wordmarkFrames(glyphs,60,184,camera,view,progress);
   close((f.bounds[0].left+f.bounds[2].right)/2,view.width/2);
   close(f.ring.left-f.bounds[0].right,f.gap);
   close(f.bounds[1].left-f.ring.right,f.gap);
   close(f.bounds[2].left-f.bounds[1].right,f.gap);
   close(f.bounds[0].left-f.rules.left,f.gap);close(f.rules.right-f.bounds[2].right,f.gap);
   assert.ok(f.bounds.every(b=>b.left>=0 && b.right<=view.width && b.top>=0 && b.bottom<=view.height));
   for(const key of ['S','O','U','L'])assert.ok(f[key].every(Number.isFinite));
   assert.ok(f.bounds[0].left<view.width/2 && f.bounds[2].right>view.width/2);
   close(f.rules.left,view.width-f.rules.right);
   assert.ok((f.ring.left+f.ring.right)/2<view.width/2);
  }
 }
});
test('complete planet scales proportionally to letter ink height, not line boxes',()=>{
 const f=w.wordmarkFrames(glyphs,60,184,g.DEFAULT_DOME,{width:1440,height:900},0);
 close(f.planetHeight,44);
 close(f.planetWidth/f.planetHeight,(w.PLANET_INK.right-w.PLANET_INK.left)/(w.PLANET_INK.bottom-w.PLANET_INK.top));
 assert.ok(f.planetHeight<glyphs[0].height);
 close(f.O[5],184-22);
});
test('rules follow centred ink edges and remain finite during camera movement',()=>{
 const view={width:844,height:290};
 for(const progress of [0,.2,.5,.8,1]){
  const camera=g.DEFAULT_DOME;
  const f=w.wordmarkFrames(glyphs,60,154,camera,view,progress);
  const path=layout.wordmarkRulePath(camera,view,f.rules,154,progress);
  assert.doesNotMatch(path,/NaN|Infinity/);assert.match(path,/M/);
  if(progress===0)assert.equal(path,`M0 154H${f.rules.left} M${f.rules.right} 154H844`);
 }
});
test('one live wordmark receives actual camera progress and arcade retains its original logo',()=>{
 const source=p=>fs.readFileSync(p,'utf8');
 const page=source('components/home/CanonicalHomepage.tsx');
 assert.match(page,/animateEntry, config, progress, mobileThird/);
 assert.match(page,/<RealPlanetHeart \/>/);assert.doesNotMatch(page,/import PlanetHeart /);
 assert.equal((page.match(/data-dome-rules/g)||[]).length,1);
 assert.doesNotMatch(source('components/home/ExteriorSpace.tsx'),/RealPlanetHeart|PLANET_HEART|planetScreenY/);
 const arcade=source('components/arcade/ArcadeGame.tsx');
 assert.match(arcade,/import PlanetHeart from '..\/home\/PlanetHeart'/);
 assert.doesNotMatch(arcade,/RealPlanetHeart|wordmarkFrames|wordmarkGeometry/);
 assert.match(arcade,/ZAP_STUN_DURATION = 1000/);
});

const social=load('socialProjection');
test('social frames interpolate fixed endpoints without feedback in either direction',()=>{
 for(const view of [{width:1440,height:900},{width:390,height:700},{width:844,height:390}]) {
  for(let index=0;index<5;index++) {
   const rect={left:view.width/2+(index-2)*88-24,top:40,width:48,height:48};
   const latitude=layout.domePageLayout(g.DEFAULT_DOME).socials;
   const start=[1,0,0,1,rect.left,rect.top];
   const end=layout.domeSurfaceFrame((index-2)*.26,latitude,.14,48,48,g.DEFAULT_DOME,view);
   for(const progress of [0,.001,.1,.25,.5,.75,.999,1,.75,.25,0]) {
    const frame=social.socialProjection(rect,index,latitude,g.DEFAULT_DOME,view,progress);
    frame.forEach((value,i)=>close(value,start[i]+(end[i]-start[i])*progress));
    assert.ok(frame.every(Number.isFinite));
   }
  }
 }
});
test('mobile icon size blends continuously instead of jumping when on-glass changes',()=>{
 for(const t of [0,.001,.1,.5,.999,1]) {
  close(social.socialIconSize(48,true,t),48-24*t);
  close(social.socialIconSize(48,false,t),48);
 }
 close(social.socialIconSize(48,true,-1),48);
 close(social.socialIconSize(48,true,2),24);
 const source=fs.readFileSync('components/home/CanonicalHomepage.tsx','utf8');
 assert.equal((source.match(/pink-icon-glow transition-colors/g)||[]).length,5);
 assert.doesNotMatch(source,/pink-icon-glow transition-all/);
});
