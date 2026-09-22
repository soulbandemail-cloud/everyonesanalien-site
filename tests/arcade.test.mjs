import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);

// Exercise the real extracted component's handlers/physics with deterministic
// hooks, viewport, clock and DOM bounds. No test-only production API or copy of physics.
function harness(width = 1280, height = 720) {
  let cursor = 0, snapshot, now = 10000, nextId = 0;
  const slots = [], effects = [], cleanups = [], intervals = new Map(), timers = new Map(), listeners = new Map();
  const react = {
    useRef(value) { const i = cursor++; return slots[i] ??= { current: value }; },
    useState(value) { const i = cursor++; if (!(i in slots)) slots[i] = typeof value === 'function' ? value() : value; return [slots[i], update => { slots[i] = typeof update === 'function' ? update(slots[i]) : update; }]; },
    useEffect(callback, deps) { const i = cursor++; if (!slots[i] || deps.some((v,j) => v !== slots[i][j])) { slots[i] = deps; effects.push(callback); } },
    useEffectEvent(callback) { const ref = react.useRef(callback); ref.current = callback; return (...args) => ref.current(...args); },
  };
  const win = {
    innerWidth: width, innerHeight: height,
    matchMedia: () => ({matches: false}),
    setInterval(fn, ms) { const id = ++nextId; intervals.set(id,{fn,ms}); return id; }, clearInterval(id) { intervals.delete(id); },
    setTimeout(fn, ms) { const id = ++nextId; timers.set(id,{fn,at:now+ms}); return id; }, clearTimeout(id) { timers.delete(id); },
    requestAnimationFrame(fn) { return win.setTimeout(fn,16); }, cancelAnimationFrame(id) { win.clearTimeout(id); },
    addEventListener(name, fn) { if (!listeners.has(name)) listeners.set(name,new Set()); listeners.get(name).add(fn); },
    removeEventListener(name, fn) { listeners.get(name)?.delete(fn); },
  };
  function compile(file, dependencies, transform = s => s) {
    const source = transform(fs.readFileSync(file,'utf8'));
    const code = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
    const loaded = {exports:{}};
    new Function('module','exports','require','window','Date','inspect',code)(loaded,loaded.exports,name => name==='react' ? react : name in dependencies ? dependencies[name] : require(name),win,{now:()=>now},value=>{snapshot=value;});
    return loaded.exports;
  }
  const lifecycle = compile('components/home/useScopedLifecycle.ts',{});
  const portable = compile('components/home/usePortableTv.ts',{'./useScopedLifecycle':lifecycle});
  const fields = ['flyingAliens','setFlyingAliens','setWish','wishPoof','wishRulesKey','pongWish','wishBarrierRef','closeWishPrompt','catchShootingStar','launchAlien','dragWishPaddle','ringBlinking','heartPulse','flashbang','womboComboKey','hideWishLayerForFlash','slowWishLayerReturn','hideCursorUfo','toggleUfoOrbit','ufoOrbiting','ufoPosRef','tractorBeamActiveRef','tractorCounts','touchesTractorBeam','recordTractorCapture','activateTvSpark','tvSparkActiveRef','orbitRef','footerRef','tvBodyRef','antennaRef','reflectAlienOffWishStars','reflectAlienOffFooterLine','reflectAlienOffTvBody','tvRef','tvPos','dragTv'];
  const game = compile('components/arcade/ArcadeGame.tsx',{'../home/useScopedLifecycle':lifecycle,'../home/usePortableTv':portable,'../home/PlanetHeart':{default:()=>null},'./arcade.css':{}},source => source.replace('const television =',`inspect({${fields.join(',')}});\nconst television =`));
  function render() { cursor=0; game.default({onRestart(){}}); for (const effect of effects.splice(0)) { const cleanup=effect(); if(cleanup) cleanups.push(cleanup); } return snapshot; }
  render();
  const rect = (left,top,width,height) => ({getBoundingClientRect:()=>({left,top,width,height,right:left+width,bottom:top+height}),offsetWidth:width,offsetHeight:height,classList:{contains:()=>false}});
  snapshot.orbitRef.current = rect(500,150,112,96);
  snapshot.footerRef.current = rect(0,height-50,width,50);
  snapshot.tvBodyRef.current = rect(900,450,320,200);
  snapshot.antennaRef.current = rect(1100,380,54,58);
  snapshot.tvRef.current = rect(900,400,320,250);
  return {
    get game(){return render();}, win, timers, intervals, listeners, rect,
    tick(aliens, elapsed=16) { if(aliens) snapshot.setFlyingAliens(aliens); now+=elapsed; for(const {fn} of intervals.values()) fn(); return render(); },
    advance(ms) { now+=ms; for(const [id,timer] of [...timers]) if(timer.at<=now) {timers.delete(id);timer.fn();} return render(); },
    event(name,event={}) { for(const fn of listeners.get(name)??[]) fn(event); return render(); },
    unmount() { cleanups.reverse().forEach(fn=>fn()); },
  };
}
const alien = (extra={}) => ({id:1,x:100,y:100,vx:0,vy:0,spin:1,...extra});
const pointer = {preventDefault(){},stopPropagation(){},clientX:200,currentTarget:{getBoundingClientRect:()=>({left:100,top:650,width:32,height:32})}};

test('arcade preserves random launch, 16ms physics and offscreen removal',()=>{
 const h=harness();h.game.launchAlien(pointer);const a=h.game.flyingAliens[0];
 assert.equal(a.x,116);assert.equal(a.y,666);assert.ok(Math.hypot(a.vx,a.vy)>=5 && Math.hypot(a.vx,a.vy)<=9);assert.ok([-1,1].includes(a.spin));
 assert.equal([...h.intervals.values()][0].ms,16);
 assert.equal(h.tick([alien({x:-81})]).flyingAliens.length,0);
});
test('heart outcomes preserve pulse, white flash and black Wombo timings',()=>{
 for(const kind of ['alien','white','black']) {
  const h=harness();const g=h.tick([alien({x:556,y:198,isSkull:kind!=='alien',isBlackSkull:kind==='black'})]);
  assert.equal(g.flyingAliens.length,0);assert.equal(g.ringBlinking,true);
  if(kind==='alien'){assert.ok(g.heartPulse.key);assert.equal(g.hideCursorUfo,true);assert.equal(g.flashbang,null);}
  else {assert.equal(g.flashbang.type,kind);assert.equal(g.hideWishLayerForFlash,true);}
  if(kind==='black') assert.ok(g.womboComboKey);
  assert.equal(h.advance(420).ringBlinking,false);
  if(kind!=='alien'){assert.equal(h.advance(80).hideWishLayerForFlash,false);assert.equal(h.game.slowWishLayerReturn,kind==='black');}
  h.advance(3000);assert.equal(h.game.flashbang,null);assert.equal(h.game.heartPulse.key,0);assert.equal(h.game.womboComboKey,0);
 }
});
test('antenna stuns, follows a moving TV, releases white then black, and enforces exit/cooldown',()=>{
 const h=harness();h.game.activateTvSpark();let g=h.tick([alien({x:1127,y:385,vx:2})]);
 assert.equal(g.flyingAliens[0].isSkull,true);assert.ok(g.flyingAliens[0].stunnedUntil);assert.equal(g.flyingAliens[0].needsSparkExit,true);
 g.antennaRef.current=h.rect(700,300,54,58);g=h.tick();assert.equal(g.flyingAliens[0].x,727);assert.equal(g.flyingAliens[0].y,305);
 h.advance(3000);g=h.tick();assert.equal(g.flyingAliens[0].stunnedUntil,undefined);assert.equal(Boolean(g.flyingAliens[0].isBlackSkull),false);
 h.game.activateTvSpark();g=h.tick([alien({isSkull:true,x:727,y:305})]);assert.equal(g.flyingAliens[0].turningBlack,true);
 h.advance(3000);g=h.tick();assert.equal(g.flyingAliens[0].isBlackSkull,true);
 h.game.activateTvSpark();g=h.tick([alien({x:727,y:305,needsSparkExit:true})]);assert.equal(g.flyingAliens[0].stunnedUntil,undefined);
 g=h.tick([alien({x:727,y:305,lastSparkCatch:16080})]);assert.equal(g.flyingAliens[0].stunnedUntil,undefined);
});
test('tractor geometry, one capture per id, three counters and 360ms removal survive extraction',()=>{
 const h=harness();h.game.ufoPosRef.current={x:200,y:200};h.game.tractorBeamActiveRef.current=true;
 assert.equal(h.game.touchesTractorBeam(alien({x:200,y:235})),true);assert.equal(h.game.touchesTractorBeam(alien({x:300,y:235})),false);
 let g=h.tick([alien({x:200,y:235}),alien({id:2,x:200,y:235,isSkull:true}),alien({id:3,x:200,y:235,isSkull:true,isBlackSkull:true})]);
 assert.deepEqual(g.tractorCounts,{alien:1,whiteSkull:1,blackSkull:1});assert.ok(g.flyingAliens.every(a=>a.tractorCaptured));
 g.recordTractorCapture(g.flyingAliens[0]);assert.equal(h.game.tractorCounts.alien,1);
 g=h.tick(null,180);assert.ok(g.flyingAliens[0].tractorScale<1);assert.equal(h.tick(null,180).flyingAliens.length,0);
 h.game.toggleUfoOrbit();assert.equal(h.game.tractorBeamActiveRef.current,false);assert.equal(h.game.ufoOrbiting,true);
});
test('ordinary wishes, forbidden rules, persistent Pong, paddle drag and responsive reflection',()=>{
 for(const width of [390,1280]) {
  const h=harness(width,800);h.game.setWish('hello');h.game.closeWishPrompt();assert.equal(h.game.wishBarrierRef.current.starOffsets.length,10);h.advance(900);assert.equal(h.game.wishBarrierRef.current,null);
  h.game.setWish('bring back to life');h.game.closeWishPrompt();assert.ok(h.game.wishRulesKey);assert.equal(h.game.wishBarrierRef.current,null);h.advance(8000);assert.equal(h.game.wishRulesKey,0);
  h.game.setWish(' PONG ');h.game.closeWishPrompt();assert.equal(h.game.wishBarrierRef.current.activeUntil,Infinity);assert.equal(h.game.wishBarrierRef.current.starOffsets.length,5);
  const y=800*(width<640?.24:.34),a=alien({x:width/2-60,y:y-30,vy:60});
  const bounce=h.game.reflectAlienOffWishStars(a,{...a,y:y+30},30000);assert.equal(bounce.vy,-60);assert.equal(bounce.y,y-18);
  h.game.dragWishPaddle(pointer);h.event('pointermove',{clientX:240});assert.equal(h.game.pongWish.x,40);assert.equal(h.game.wishBarrierRef.current.xOffset,40);
  h.event('pointerup');assert.equal(h.listeners.get('pointermove').size,1);
 }
});
test('swept footer and TV face/corner reflections retain cooldowns and residual movement',()=>{
 const h=harness(),g=h.game;
 const f=alien({x:200,y:650,vx:4,vy:40});let result=g.reflectAlienOffFooterLine(f,{...f,x:204,y:690},10000);assert.equal(result.vy,-40);assert.equal(result.y,652);
 assert.equal(g.reflectAlienOffFooterLine({...f,lastFooterBounce:9999},{...f,y:690},10000).vy,40);
 const a=alien({x:860,y:500,vx:40});result=g.reflectAlienOffTvBody(a,{...a,x:900},10000);assert.equal(result.vx,-40);assert.equal(result.x,868);
 const c=alien({x:864,y:414,vx:40,vy:40});result=g.reflectAlienOffTvBody(c,{...c,x:904,y:454},10000);assert.equal(result.vx,-40);assert.equal(result.vy,-40);
 g.tvRef.current.classList.contains=()=>true;assert.equal(g.reflectAlienOffTvBody(a,{...a,x:900},10000).vx,40);
});
test('public and game TV preserve two-position drag; game exit clears physics, delayed effects and mid-drag listeners',()=>{
 const h=harness();h.game.dragTv(pointer);h.event('pointermove',{clientX:150});h.event('pointerup');assert.equal(h.game.tvPos.x,26);
 h.game.dragTv(pointer);h.event('pointermove',{clientX:250});h.event('pointerup');assert.equal(h.game.tvPos.x,934);
 const position=h.game.tvPos.x;h.game.dragTv(pointer);h.event('pointermove',{clientX:205});h.event('pointerup');assert.equal(h.game.tvPos.x,position);
 h.game.activateTvSpark();h.game.setWish('pong');h.game.closeWishPrompt();h.game.dragWishPaddle(pointer);h.game.dragTv(pointer);
 h.unmount();assert.equal(h.intervals.size,0);assert.equal(h.timers.size,0);for(const set of h.listeners.values()) assert.equal(set.size,0);
});
