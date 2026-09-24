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
const {DEFAULT_DOME:config,domePoint}=geometry;
const source=p=>fs.readFileSync(p,'utf8');

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
test('wordmark reuses the shaded real planet with white rings in the correct depth order',()=>{
 const scene=source('components/home/RealPlanetHeart.tsx');
 assert.ok(scene.indexOf('data-ring="rear"')<scene.indexOf('fill={`url(#${id})`}'));
 assert.ok(scene.indexOf('fill={`url(#${id})`}')<scene.indexOf('data-ring="front"'));
 assert.match(source('components/home/CanonicalHomepage.tsx'),/<RealPlanetHeart \/>/);
 assert.equal((scene.match(/stroke="white"/g)||[]).length,2);
 assert.match(scene,/stopColor="#9eccc4"/);
 assert.match(scene,/stopColor="#41646f"/);
 assert.match(scene,/rotate\(-18\)/);
 assert.doesNotMatch(source('components/home/ExteriorSpace.tsx'),/planet-heart|<svg/);
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

test('dome frame maps DOM corners onto the spherical samples across desktop and mobile viewports',()=>{
 const zones=layout.domePageLayout(config);
 assert.equal(zones.caption,config.topLatitude+.12);
 assert.equal(zones.captionWidth,.52);
 for(const view of [{width:1440,height:900},{width:844,height:290},{width:390,height:700}]) {
  for(const phi of [zones.brand,zones.caption,zones.socials])for(const theta of [-.4,0,.4]){
   const width=48,height=32,angle=.12;
   const frame=layout.domeSurfaceFrame(theta,phi,angle,width,height,config,view);
   assert.equal(frame.length,6);assert.ok(frame.every(Number.isFinite));
   const [a,b,c,d,e,f]=frame;
   const angularHeight=angle*height/width*Math.cos(phi);
   const corners=[[0,0,theta-angle/2,phi+angularHeight/2],[width,0,theta+angle/2,phi+angularHeight/2],[0,height,theta-angle/2,phi-angularHeight/2]];
   for(const [x,y,t,p] of corners){
    const expected=domePoint(t,p,config,view);
    assert.ok(Math.abs(a*x+c*y+e-expected.x)<1e-9);
    assert.ok(Math.abs(b*x+d*y+f-expected.y)<1e-9);
   }
  }
 }
});
