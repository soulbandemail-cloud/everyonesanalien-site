import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
function load(file,deps={}) {
 const m={exports:{}};
 new Function('module','exports','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(m,m.exports,n=>deps[n]);
 return m.exports;
}
const geometry=load('lib/ship/domeGeometry.ts');
const room=load('lib/ship/roomGeometry.ts',{'./domeGeometry':geometry});
const transition=load('lib/ship/cameraTransition.ts',{'./roomGeometry':room});
const exterior=load('lib/ship/exteriorSpace.ts',{'./domeGeometry':geometry,'./cameraTransition':transition});
const layout=load('lib/ship/domePageLayout.ts',{'./domeGeometry':geometry});
const {DEFAULT_DOME:config,project,domePoint}=geometry;
const source=p=>fs.readFileSync(p,'utf8');

test('one distant planet projects through the existing camera with negligible cockpit-scale parallax',()=>{
 for(const view of [{width:1440,height:900},{width:390,height:844}]) {
  const start=project(exterior.PLANET_HEART.position,transition.transitionCamera(config,0),view);
  const end=project(exterior.PLANET_HEART.position,config,view);
  assert.ok(start.visible && end.visible);
  assert.ok(Math.hypot(end.x-start.x,end.y-start.y)<1);
  assert.ok(Math.abs(end.scale/start.scale-1)<.002);
  for(const progress of [0,.25,.5,.75,1]) {
   const p=project(exterior.PLANET_HEART.position,transition.transitionCamera(config,progress),view);
   assert.ok(p.x>0 && p.x<view.width && p.y>0 && p.y<view.height);
  }
 }
});
test('distant star plane starts at the public layout and moves continuously without regeneration',()=>{
 const view={width:1440,height:900};
 const matrix=exterior.exteriorPlane(config,transition.transitionCamera(config,0),view).slice(7,-1).split(',').map(Number);
 matrix.forEach((n,i)=>assert.ok(Math.abs(n-[1,0,0,1,0,0][i])<.001));
 const page=source('components/home/CanonicalHomepage.tsx');
 assert.equal((page.match(/<ExteriorSpace /g)||[]).length,1);
 assert.match(page,/<DomeWishes active={!cockpit}/);
 assert.doesNotMatch(source('components/home/ExteriorSpace.tsx'),/Math.random|cockpit|Date.now/);
 assert.doesNotMatch(source('components/ship/Ship.tsx'),/styles.space|73.31|31.71/);
});
test('exterior retains the same four-point twinkle and shooting animations behind ship structure',()=>{
 const css=source('app/globals.css');
 assert.match(css,/50% 0%,[\s\S]*58% 42%,[\s\S]*100% 50%/);
 assert.match(css,/animation: star-glint/);assert.match(css,/@keyframes shooting-star-one/);
 assert.match(source('components/home/ExteriorSpace.tsx'),/className="stars"/);
 assert.match(source('components/home/exterior.css'),/z-index:-1; pointer-events:none/);
 assert.match(source('components/ship/ship.module.css'),/\.ship \{[^}]*z-index: 2/);
 assert.match(source('components/home/DomeWishes.tsx'),/if \(!active\) return/);
 assert.match(source('components/home/DomeWishes.tsx'),/active && \(wishPrompt/);
});
test('real planet has rear ring, opaque heart, front ring in that paint order and does not replace logo',()=>{
 const scene=source('components/home/ExteriorSpace.tsx');
 assert.ok(scene.indexOf('data-ring="rear"')<scene.indexOf('fill={`url(#${id})`}'));
 assert.ok(scene.indexOf('fill={`url(#${id})`}')<scene.indexOf('data-ring="front"'));
 assert.match(source('components/home/CanonicalHomepage.tsx'),/<PlanetHeart \/>/);
 assert.match(scene,/project\(PLANET_HEART.position,camera,view\)/);
});
test('each dome surface patch follows sampled curvature, including different slopes across the header',()=>{
 const view={width:1440,height:900},phi=config.topLatitude;
 const left=layout.domeSurfaceFrame(-.3,phi,.1,48,48,config,view);
 const right=layout.domeSurfaceFrame(.3,phi,.1,48,48,config,view);
 assert.ok(left[1]>0 && right[1]<0);
 const expected=domePoint(-.35,phi+.05*Math.cos(phi),config,view);
 assert.equal(left[4],expected.x);assert.equal(left[5],expected.y);
 const hook=source('components/home/useDomeProjection.ts');
 assert.match(hook,/h1 > \*/);assert.match(hook,/socials.* > a/);
 assert.match(hook,/brand.* p/);assert.match(hook,/domeSurfaceFrame\(/);
 assert.doesNotMatch(hook,/cloneNode|canvas|innerHTML/);
});

test('caption letters follow distinct dome slopes below the raised social latitude',()=>{
 const zones=layout.domePageLayout(config),view={width:1440,height:900};
 assert.equal(zones.socials,config.topLatitude+.24);
 assert.ok(zones.socials>zones.caption && zones.caption>zones.brand);
 assert.ok(zones.captionWidth<.6);
 const left=layout.domeSurfaceFrame(-zones.captionWidth/2,zones.caption,.035,12,16,config,view);
 const right=layout.domeSurfaceFrame(zones.captionWidth/2,zones.caption,.035,12,16,config,view);
 assert.ok(left[1]>0 && right[1]<0);
 assert.match(source('components/home/CanonicalHomepage.tsx'),/Array.from\("a band called\.\.\."\)/);
 assert.match(source('components/home/useDomeProjection.ts'),/p > \[data-dome-caption\]/);
});

 test('real planet is centred on the ship axis and doubled in world size',()=>{
 assert.equal(exterior.PLANET_HEART.position.x,0);
 assert.equal(exterior.PLANET_HEART.radius,1300);
 assert.equal(exterior.PLANET_HEART.position.y,500);
});

test('first-person planet follows its content anchor without moving the third-person endpoint',()=>{
 assert.equal(exterior.planetScreenY(340,540,0),540);
 assert.equal(exterior.planetScreenY(340,540,.5),440);
 assert.equal(exterior.planetScreenY(340,540,1),340);
 assert.equal(exterior.planetScreenY(340,null,0),340);

 assert.match(source('components/home/ExteriorSpace.tsx'),/firstPersonPlanetY\(view.height\)/);
});

test('first-person planet keeps its settled position independently of signup/login mode',()=>{
 const y=exterior.firstPersonPlanetY(800);
 assert.equal(y,480);
 assert.equal(exterior.planetScreenY(340,y,1),340);
 const scene=source('components/home/ExteriorSpace.tsx');
 assert.doesNotMatch(scene,/MutationObserver|querySelector|controlsBottom|enterTop/);

});
