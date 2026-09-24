import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);

// Exercise the real extracted component's handlers/physics with deterministic
// hooks, viewport, clock and DOM bounds. No test-only production API or copy of physics.
export function harness(width = 1280, height = 720, mode = 'arcade') {
  let cursor = 0, snapshot, tree, now = 10000, nextId = 0;
  const slots = [], effects = [], cleanups = [], intervals = new Map(), timers = new Map(), listeners = new Map();
  const react = {
    useRef(value) { const i = cursor++; return slots[i] ??= { current: value }; },
    useState(value) { const i = cursor++; if (!(i in slots)) slots[i] = typeof value === 'function' ? value() : value; return [slots[i], update => { slots[i] = typeof update === 'function' ? update(slots[i]) : update; }]; },
    useEffect(callback, deps) { const i = cursor++; if (!slots[i] || deps.some((v,j) => v !== slots[i][j])) { slots[i] = deps; effects.push(() => { cleanups[i]?.(); cleanups[i] = callback(); }); } },
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
    new Function('module','exports','require','window','Date','inspect','performance',code)(loaded,loaded.exports,name => name==='react' ? react : name in dependencies ? dependencies[name] : require(name),win,{now:()=>now},value=>{snapshot=value;},{now:()=>now});
    return loaded.exports;
  }
  const lifecycle = compile('components/home/useScopedLifecycle.ts',{});
  const portable = compile('components/home/usePortableTv.ts',{'./useScopedLifecycle':lifecycle});
  const electricalMath = compile('components/arcade/discharge.ts',{});
  const presentation = compile('components/arcade/presentation.ts',{});
  const electricalHook = compile('components/arcade/useOrbitDischarge.ts',{'./discharge':electricalMath,'./presentation':presentation});
  const fields = mode === 'arcade' ? ['flyingAliens','setFlyingAliens','launchAlien','ringBlinking','heartPulse','flashbang','womboComboKey','hideCursorUfo','toggleUfoOrbit','ufoOrbiting','ufoPosRef','tractorBeamActiveRef','tractorCounts','touchesTractorBeam','recordTractorCapture','orbitRef','ufoOrbitingRef','footerRef','reflectAlienOffFooterLine','electricity','gameRoot'] : ['wishPrompt','wish','setWish','wishPoof','wishRulesKey','pongWish','wishBarrierRef','closeWishPrompt','catchShootingStar','dragWishPaddle'];
  const rules = compile('components/home/WishRules.tsx',{});
  const physics = compile('components/home/wishPhysics.ts',{});
  const dependencies = {'./presentation':presentation,'./discharge':electricalMath,'./useOrbitDischarge':electricalHook,'../home/useScopedLifecycle':lifecycle,'../home/usePortableTv':portable,'../home/PlanetHeart':{default:()=>null},'./arcade.css':{},'./useScopedLifecycle':lifecycle,'./WishRules':rules,'./wishes.css':{}};
  const game = mode === 'tv' ? {default:()=>{snapshot=portable.usePortableTv();return null;}} : compile(mode === 'arcade' ? 'components/arcade/ArcadeGame.tsx' : 'components/home/DomeWishes.tsx',dependencies,source => source.replace(mode === 'arcade' ? 'return (\n  <div ref={gameRoot}' : 'return <>',`inspect({${fields.join(',')}});\n${mode === 'arcade' ? 'return (\n  <div ref={gameRoot}' : 'return <>'}`));
  const rootListeners=new Map();
  const captured=new Set();
  const surface={
    querySelector:()=>({getBoundingClientRect:()=>({width:32})}),
    addEventListener:(name,fn)=>{if(!rootListeners.has(name))rootListeners.set(name,new Set());rootListeners.get(name).add(fn);},
    removeEventListener:(name,fn)=>rootListeners.get(name)?.delete(fn),
    setPointerCapture:id=>captured.add(id),hasPointerCapture:id=>captured.has(id),releasePointerCapture:id=>captured.delete(id),
  };
  function render() { cursor=0; tree=game.default({onRestart(){}});if(mode==='arcade')snapshot.gameRoot.current=surface;if(mode==='tv')snapshot.tvRef.current=snapshot.tvPos ? rect(900,400,320,250) : null; for (const effect of effects.splice(0)) { const cleanup=effect(); if(cleanup) cleanups.push(cleanup); } return snapshot; }
  const rect = (left,top,width,height) => ({getBoundingClientRect:()=>({left,top,width,height,right:left+width,bottom:top+height}),offsetWidth:width,offsetHeight:height,classList:{contains:()=>false}});
  render();
  if (mode === 'arcade') {
  snapshot.orbitRef.current = rect(500,150,112,96);
  snapshot.footerRef.current = rect(0,height-50,width,50);
  snapshot.orbitRef.current.querySelector=()=>null;
  }
  let orbitAngle=0;
  const animation={animationName:'ufo-orbit-path',effect:{getComputedTiming:()=>({currentIteration:Math.floor(orbitAngle/(2*Math.PI)),progress:orbitAngle/(2*Math.PI)%1})}};
  const orbiter={getAnimations:()=>[animation],getBoundingClientRect:()=>({left:500+56+40*Math.cos(orbitAngle)-16,top:150+48+21*Math.sin(orbitAngle)-16,width:32,height:32})};
  return {
    setOrbitAngle(angle){orbitAngle=angle;snapshot.orbitRef.current.querySelector=()=>orbiter;},
    rootEvent(name,event){for(const fn of rootListeners.get(name)??[])fn({button:0,isPrimary:true,pointerId:1,target:{closest:()=>null},preventDefault(){},...event});return render();},
    captured,rootListeners,
    get tree(){render();return tree;}, get game(){ const value=render();return mode !== 'home' ? value : {...value,reflectAlienOffWishStars:(a,b,now)=>physics.reflectOffWishStars(a,b,now,value.wishBarrierRef.current,{width,height})};}, win, timers, intervals, listeners, rect,
    tick(aliens, elapsed=16) { if(aliens) snapshot.setFlyingAliens(aliens); now+=elapsed; for(const {fn} of intervals.values()) fn(); return render(); },
    advance(ms) { now+=ms; for(const [id,timer] of [...timers]) if(timer.at<=now) {timers.delete(id);timer.fn();} return render(); },
    event(name,event={}) { for(const fn of listeners.get(name)??[]) fn(event); return render(); },
    unmount() { cleanups.reverse().forEach(fn=>fn?.()); },
  };
}
export function nodes(tree) {
 if(!tree || typeof tree !== 'object') return [];
 if(Array.isArray(tree)) return tree.flatMap(nodes);
 return [tree,...nodes(tree.props?.children)];
}
