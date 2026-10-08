import { memo, useEffect, useId, useState } from 'react';
import { project, type DomeConfig, type Vec3, type Viewport } from '@/lib/ship/domeGeometry';
import { polygonPath } from '@/lib/ship/roomGeometry';
import { FIXTURES, orientedFixtures, consoleTvScreen, type FixturePlacement } from '@/lib/ship/fixtureLayout';
import {UPCOMING_POSTERS,type DomeMenu} from '@/lib/ship/domeNavigation';
import styles from './ship.module.css';
import {rasterPoster} from '@/lib/ship/posterRaster';

type Props = { config: DomeConfig; view: Viewport; onArcade?: () => void; onTV?:()=>void; onNewsletter?:()=>void; onShows?:()=>void; onMerch?:()=>void; domeMenu?:DomeMenu; liveTv?:boolean; reading?:boolean };

/** Crude world-space solids: no owned items, controls, playback or inventory state. */
export const Fixtures = memo(function Fixtures({ config, view, onArcade, onTV, onNewsletter, onShows, onMerch, domeMenu=null, liveTv=false,reading=false }: Props) {
  const outlineId=useId();
  const [pressed,setPressed]=useState<'tv'|'arcade'|'newsletter'|'shows'|'merch'|null>(null);
  const interaction=(name:'tv'|'arcade'|'newsletter'|'shows'|'merch',action?:()=>void)=>({
    tabIndex:action ? 0 : -1, 'aria-disabled':!action, 'data-pressed':pressed===name || undefined,
    onClick:action,
    onPointerMove:(event:React.PointerEvent<SVGGElement>)=>{delete event.currentTarget.dataset.resting;},
    onFocus:(event:React.FocusEvent<SVGGElement>)=>{delete event.currentTarget.dataset.resting;},
    onPointerDown:(event:React.PointerEvent<SVGGElement>)=>{if(action && event.button===0){delete event.currentTarget.dataset.resting;event.currentTarget.setPointerCapture(event.pointerId);setPressed(name);}},
    onPointerUp:()=>setPressed(null),onPointerCancel:()=>setPressed(null),onPointerLeave:(event:React.PointerEvent<SVGGElement>)=>{if(!event.currentTarget.hasPointerCapture(event.pointerId))setPressed(null);},onBlur:()=>setPressed(null),
    onKeyDown:(event:React.KeyboardEvent)=>{if(action && (event.key==='Enter' || event.key===' ')){event.preventDefault();setPressed(name);}},
    onKeyUp:(event:React.KeyboardEvent)=>{if(action && pressed===name && (event.key==='Enter' || event.key===' ')){event.preventDefault();setPressed(null);action();}},
  });
  const tvScreen=consoleTvScreen(config,view);
  const path = (points: Vec3[]) => polygonPath(points, config, view);
  const local = (f: FixturePlacement, x: number, y: number, z: number): Vec3 => ({
    x: f.x + f.scale * (x * (f.widthScale ?? 1) * Math.cos(f.yaw) + z * Math.sin(f.yaw)),
    y: f.y + y * f.scale,
    z: f.z + f.scale * (z * Math.cos(f.yaw) - x * (f.widthScale ?? 1) * Math.sin(f.yaw)),
  });
  function paddedPath(points:Vec3[]) {
    const q=points.map(p=>project(p,config,view));
    const lerp=(a:typeof q[number],b:typeof q[number],t:number)=>`${a.x+(b.x-a.x)*t},${a.y+(b.y-a.y)*t}`;
    return q.map((p,i)=>{const prev=q[(i+q.length-1)%q.length],next=q[(i+1)%q.length];return `${i?'L':'M'}${lerp(prev,p,.8)} Q${p.x},${p.y} ${lerp(p,next,.2)}`;}).join(' ')+' Z';
  }
  function box(f: FixturePlacement, x: number, y: number, z: number, w: number, h: number, d: number, colour = '#46565e') {
    const p = (dx: number, dy: number, dz: number) => local(f, x + dx, y + dy, z + dz);
    // Preserve the radio exactly. Side furnishings use depth-sorted box faces.
    const faces = [
      { points: [p(-w/2,0,-d/2),p(-w/2,0,d/2),p(-w/2,h,d/2),p(-w/2,h,-d/2)], fill: '#34444e' },
      { points: [p(w/2,0,-d/2),p(w/2,0,d/2),p(w/2,h,d/2),p(w/2,h,-d/2)], fill: '#34444e' },
      { points: [p(-w/2,h,-d/2),p(w/2,h,-d/2),p(w/2,h,d/2),p(-w/2,h,d/2)], fill: '#627176' },
      { points: [p(-w/2,0,-d/2),p(w/2,0,-d/2),p(w/2,h,-d/2),p(-w/2,h,-d/2)], fill: colour },
    ];
    if (f !== FIXTURES.radio) {
      faces.push({ points: [p(-w/2,0,d/2),p(w/2,0,d/2),p(w/2,h,d/2),p(-w/2,h,d/2)], fill: colour });
      const depth = (face: typeof faces[number]) => face.points.reduce((sum,p) => sum + project(p,config,view).depth,0);
      faces.sort((a,b) => depth(b) - depth(a));
    }
    const cabinet=f===music,gameCabinet=f===arcade;
    const lounge=f===sofa,wood=f===table && colour!=='#eee5cd';
    return <g stroke={gameCabinet?'#b67fb7':cabinet?'#4b3020':lounge?'#393d2b':wood?'#503923':'#849396'} strokeWidth="1" strokeLinejoin="round">{faces.map((face,i) => {
      const d=lounge?paddedPath(face.points):path(face.points);
      return <g key={i}><path d={d} fill={gameCabinet?`url(#${outlineId}-arcade-paint)`:cabinet?`url(#${outlineId}-veneer)`:lounge?`url(#${outlineId}-cloth)`:wood?`url(#${outlineId}-wood)`:face.fill}/>{f !== FIXTURES.radio && <path d={d} fill={`url(#${outlineId}-surface)`} stroke="none" pointerEvents="none"/>}{(cabinet||lounge||gameCabinet) && face.points.every(point=>{
        const dx=point.x-f.x,dz=point.z-f.z;
        return dx*Math.sin(f.yaw)+dz*Math.cos(f.yaw)>0;
      }) && <path d={d} fill="#e4b874" opacity=".045" stroke="none" pointerEvents="none"/>}{lounge && <path d={d} fill="none" stroke="#b2a37a" strokeOpacity=".32" strokeWidth=".55"/>}</g>;
    })}</g>;
  }

  function line(f: FixturePlacement, a: number[], b: number[], colour = '#a1aeac', width = 3) {
    return <path d={path([local(f,a[0],a[1],a[2]),local(f,b[0],b[1],b[2])])} fill="none" stroke={colour} strokeWidth={width} strokeLinecap="round" />;
  }
  function flatArt(f: FixturePlacement, x: number, y: number, z: number, width: number, children: React.ReactNode, plane: 'vertical' | 'horizontal' | 'side' = 'vertical') {
    const p = project(local(f,x,y,z), config, view);
    if (!p.visible) return null;
    if (f === FIXTURES.radio) return <g transform={`translate(${p.x} ${p.y}) scale(${(p.scale * f.scale * width / 100).toFixed(6)})`}>{children}</g>;
    // Small illustrated details inherit the local surface's perspective basis,
    // rather than remaining camera-facing billboards or being spun in screen space.
    const unit = width / 100;
    const right = project(local(f,plane === 'side' ? x : x+unit,y,plane === 'side' ? z+unit : z), config, view);
    const down = project(local(f,x,plane !== 'horizontal' ? y-unit : y,plane === 'horizontal' ? z-unit : z), config, view);
    const matrix = [right.x-p.x,right.y-p.y,down.x-p.x,down.y-p.y,p.x,p.y].map(n=>n.toFixed(6)).join(' ');
    return <g transform={`matrix(${matrix})`}>{children}</g>;
  }
  const fixtures = orientedFixtures(config.centre, config.radius);
const radio = fixtures.radio, music = fixtures.musicStation, sofa = fixtures.sofa;
const rail = fixtures.clothesRail, table = fixtures.coffeeTable, arcade = fixtures.arcade;
  return <svg className={styles.fixtures} width={view.width} height={view.height} style={{'--fixture-hover-filter':`url(#${outlineId})`} as React.CSSProperties} role="group" aria-label="Empty base ship fixtures: radio left, gramophone and empty record cabinet right, empty sofa left, empty clothes rail right, coffee table with current Hyper-Fix foremost">
    <defs>
      <radialGradient id={`${outlineId}-fairy-glow`}><stop stopColor="#ffe6a9" stopOpacity=".25"/><stop offset=".35" stopColor="#ffd98d" stopOpacity=".1"/><stop offset="1" stopColor="#ffd98d" stopOpacity="0"/></radialGradient>
      <linearGradient id={`${outlineId}-arcade-paint`} x2=".3" y2="1"><stop stopColor="#30303e"/><stop offset=".25" stopColor="#181e2c"/><stop offset="1" stopColor="#101522"/></linearGradient>
      <linearGradient id={`${outlineId}-veneer`} x2=".25" y2="1"><stop stopColor="#956c43"/><stop offset=".2" stopColor="#704829"/><stop offset=".75" stopColor="#4c301f"/><stop offset="1" stopColor="#795034"/></linearGradient>
      <linearGradient id={`${outlineId}-brass`} x2=".8" y2="1"><stop stopColor="#ba9862"/><stop offset=".32" stopColor="#94713f"/><stop offset=".65" stopColor="#65502f"/><stop offset="1" stopColor="#a48651"/></linearGradient>
      <radialGradient id={`${outlineId}-bell`} cx=".92" cy=".72" r=".95"><stop stopColor="#332b1e"/><stop offset=".55" stopColor="#705231"/><stop offset="1" stopColor="#af8952"/></radialGradient>
      <linearGradient id={`${outlineId}-cloth`} x2=".3" y2="1"><stop stopColor="#858463"/><stop offset=".35" stopColor="#686e4f"/><stop offset="1" stopColor="#414735"/></linearGradient>
      <linearGradient id={`${outlineId}-wood`} x2=".2" y2="1"><stop stopColor="#af8050"/><stop offset=".4" stopColor="#926139"/><stop offset="1" stopColor="#634329"/></linearGradient>
      <linearGradient id={`${outlineId}-surface`} x1="1" y1="0" x2="0" y2="1"><stop stopColor="#c4d0df" stopOpacity=".07"/><stop offset=".3" stopColor="#111b24" stopOpacity="0"/><stop offset=".62" stopColor="#111b24" stopOpacity=".12"/><stop offset="1" stopColor="#060e17" stopOpacity=".36"/></linearGradient>
      <filter id={outlineId} x="-100%" y="-100%" width="300%" height="300%" colorInterpolationFilters="sRGB">
        {/* A softened alpha contour expands equally in every direction, rounding
            corners without morphology's square dilation kernel. */}
        <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="softSilhouette" />
        <feComponentTransfer in="softSilhouette" result="expanded">
          <feFuncA type="linear" slope="12" intercept="-1.5" />
        </feComponentTransfer>
        <feComposite in="expanded" in2="SourceAlpha" operator="out" result="edge" />
        <feFlood floodColor="#6ee7b7" result="mint" />
        <feComposite in="mint" in2="edge" operator="in" result="outline" />
        <feMerge><feMergeNode in="outline" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    <g className="show-posters cockpit-interactive-fixture" role="button" aria-label="Upcoming show posters" aria-expanded={domeMenu==='shows'} {...interaction('shows',onShows)} style={{pointerEvents:onShows ? 'auto' : 'none'}}>
      <title>THE SHOWS</title>
      <PosterArtwork config={config} view={view} />
    </g>
    <g className="console-tv cockpit-interactive-fixture" role="button" aria-label="Maximise TV" {...interaction('tv',onTV)}
      style={{pointerEvents:onTV ? 'auto' : 'none',transformBox:'view-box',transformOrigin:`${tvScreen.x+42*tvScreen.scale}px ${tvScreen.y+18*tvScreen.scale}px`}}>
      <title>Soul TV</title>
  {box(radio,0,0,0,1.05,.58,.38,'#513522')}

  {flatArt(
    radio,
    0,
    .26,
    -.2,
    .95,
    <g>
      <defs>
        <linearGradient id={`${outlineId}-tv-wood`} x2=".25" y2="1">
          <stop stopColor="#956641"/><stop offset=".35" stopColor="#644129"/><stop offset="1" stopColor="#35251d"/>
        </linearGradient>
        <linearGradient id={`${outlineId}-tv-bezel`} x2="0" y2="1">
          <stop stopColor="#292726"/><stop offset=".65" stopColor="#131c20"/><stop offset="1" stopColor="#71614d"/>
        </linearGradient>
      </defs>
      <rect x="-54" y="-32" width="108" height="60" rx="5" fill={`url(#${outlineId}-tv-wood)`} stroke="#36251b" strokeWidth="1.2"/>
      <path d="M-49 22V-25Q-49 -28 -45 -28H46" fill="none" stroke="#c39b67" strokeOpacity=".4" strokeWidth="1"/>
      <path d="M50 -24V21Q50 24 46 24H-46" fill="none" stroke="#211b17" strokeOpacity=".6" strokeWidth="1.5"/>
      {/* Rounded CRT surround; the entire front is devoted to the screen. */}
      <rect
        x="-45"
        y="-21"
        width="90"
        height="42"
        rx="4"
        fill={`url(#${outlineId}-tv-bezel)`}
      />

      {/* thumbnail fills almost the entire frontage */}
      {!liveTv && <image
        href="/tv-poster.png"
        x="-42"
        y="-18"
        width="84"
        height="36"
        preserveAspectRatio="xMidYMid slice"
      />}
    </g>
  )}

  {/* Centred bunny ears; the console TV has no carry handle. */}
  {flatArt(radio,0,.59,.1,.2,<ellipse cx="0" cy="0" rx="28" ry="12" fill="#72654e" stroke="#bcaa87" strokeWidth="3"/>)}
  {line(radio,[0,.6,.1],[-.23,1.02,.1],'#bbae8c',1.5)}
  {line(radio,[0,.6,.1],[.23,1.02,.1],'#bbae8c',1.5)}
  {[-.23,.23].map(x=><g key={x}>{flatArt(radio,x,1.02,.1,.05,<circle r="30" fill="#d4c7a1"/>)}</g>)}
</g>
    <g aria-label="Wooden record cabinet with gramophone, one stored EP sleeve and empty record stand">
      {[-1.3,1.3].flatMap(x=>[-.3,.28].map(z=><g key={`${x}-${z}`}><path d={path([local(music,x-.075,.2,z),local(music,x+.075,.2,z),local(music,x+.045,0,z-.035),local(music,x-.04,0,z-.035)])} fill="#67452d" stroke="#49321f" strokeWidth=".7"/></g>))}
      {box(music,0,.2,.3,2.85,.94,.09)}
      {box(music,0,.2,0,2.8,.1,.75)}
      {box(music,-1.4,.2,0,.12,.94,.75)}
      {/* One unframed sleeve: its plane faces across the cabinet, leaning left at the top. */}
      {(()=>{
        const a=project(local(music,-1.28,1.02,.28),config,view);
        const b=project(local(music,-1.28,1.02,-.34),config,view);
        const c=project(local(music,-1.03,.31,.28),config,view);
        return <image href="/records/experiencing-the-role.png" width="100" height="100" preserveAspectRatio="none" aria-label="Experiencing the Role EP sleeve leaning against the left inner wall" transform={`matrix(${(b.x-a.x)/100} ${(b.y-a.y)/100} ${(c.x-a.x)/100} ${(c.y-a.y)/100} ${a.x} ${a.y})`}/>;
      })()}
      {box(music,1.4,.2,0,.12,.94,.75)}
      {box(music,0,1.14,0,3,.12,.9)}
      {[-1.44,1.44].map(x=><g key={x}>{[0,1,2,3].map(i=><path key={i} d={path(Array.from({length:18},(_,j)=>local(music,x,.28+j/17*.78,-.26+i*.15+.012*Math.sin(j*.7+i))))} fill="none" stroke="#b18c59" strokeOpacity=".22" strokeWidth=".6"/>)}</g>)}
      {box(music,-.72,1.26,0,1.2,.13,.65)}
      {flatArt(music,-.72,1.405,-.08,.95,<g><ellipse rx="38" ry="35" fill="#302c24" stroke="#aa8b58" strokeWidth="2"/><circle r="29" fill="#191e1c" stroke="#5a5945"/><circle r="11" fill="#9e8050"/><circle r="2" fill="#d7bd88"/><path d="M41 -24L35 -21 20 8 10 12" fill="none" stroke="#b49a6d" strokeWidth="3"/><rect x="7" y="10" width="8" height="5" fill="#5a4931"/></g>,'horizontal')}
      {flatArt(music,-.65,1.4,.15,1.35,<g stroke="#725333" strokeWidth="1.4">
        {/* One continuous outer shell: curved neck, widening throat and long bell wall. */}
        <path d="M12 0C24 -12 22 -22 12 -29C-1 -38 -10 -39 -25 -34L-65 -25Q-87 -39 -83 -63Q-81 -86 -61 -98C-40 -80 -19 -62 1 -49C19 -41 33 -27 29 -14L20 0Z" fill={`url(#${outlineId}-brass)`}/>
        {/* Broad camera-facing mouth: shallow scallops only on the outer lip. */}
        <path d="M-63 -99C-43 -101 -30 -94 -23 -87C-8 -82 -2 -68 -7 -58C-5 -45 -17 -34 -31 -31C-45 -23 -66 -24 -80 -29C-99 -29 -116 -39 -117 -51C-127 -64 -121 -78 -106 -85C-96 -97 -78 -100 -63 -99Z" fill={`url(#${outlineId}-bell)`} stroke="#bc9863" strokeWidth="1.8"/>
        {/* One uninterrupted concavity; the broad near wall fades into the far throat. */}
        <path d="M-105 -83C-85 -96 -49 -96 -23 -83C-7 -70 -10 -49 -30 -37C-49 -29 -83 -31 -103 -43C-79 -39 -47 -42 -24 -56C-43 -68 -76 -78 -105 -83Z" fill="#30281d" opacity=".28" stroke="none"/>
        <path d="M-114 -53C-91 -35 -52 -32 -30 -40" fill="none" stroke="#d0ae75" strokeOpacity=".3" strokeWidth="2.2"/>
        <path d="M-104 -83C-79 -77 -49 -65 -24 -56M-112 -52C-81 -46 -50 -48 -24 -56" fill="none" stroke="#c6a875" strokeOpacity=".14" strokeWidth=".8"/>
        <path d="M-44 -85Q-20 -59 4 -45C22 -35 30 -22 23 -8M-51 -30Q-12 -43 13 -30" fill="none" stroke="#c3a06b" strokeOpacity=".48" strokeWidth="1.1"/>
      </g>)}
      {/* Empty two-arm sleeve easel, with no display board or extra electronics. */}
      {[.58,1.02].map(x=><g key={x}>{line(music,[x,1.27,-.23],[x,1.65,.12],'#986a3f',2.3)}{line(music,[x,1.27,.28],[x,1.65,.12],'#67482c',2)}{line(music,[x-.08,1.3,-.24],[x+.08,1.3,-.24],'#b58a53',2.5)}</g>)}
    </g>
    <g aria-label="Compact two-seat sofa on left main floor">
      {(() => {
        // Paint the continuous frame before the cushions; centre-depth sorting
        // incorrectly lets the base/back cover the right cushion and far arm.
        const parts = [
          ...[-1.22,.36].flatMap(x=>[-.4,.36].map(z=>({name:`leg-${x}-${z}`,x,y:0,z,w:.13,h:.12,d:.13}))),
          {name:'base',x:-.43,y:.12,z:-.03,w:2,h:.2,d:1.09},
          {name:'backrest',x:-.43,y:.32,z:.32,w:1.66,h:.78,d:.39},
          {name:'arm-right',x:.4,y:.32,z:-.03,w:.34,h:.44,d:1.09},
          ...[-.095,-.765].map((x,i)=>({name:`seat-${i+1}`,x,y:.32,z:-.22,w:.65,h:.27,d:.68})),
          {name:'arm-left',x:-1.26,y:.32,z:-.03,w:.34,h:.44,d:1.09},
        ];

        return parts.map(p=><g key={p.name} data-sofa-part={p.name}>{box(sofa,p.x,p.y,p.z,p.w,p.h,p.d)}{p.name.startsWith('seat-') && <path d={paddedPath([local(sofa,p.x-p.w/2,p.y+p.h,p.z-p.d/2),local(sofa,p.x+p.w/2,p.y+p.h,p.z-p.d/2),local(sofa,p.x+p.w/2,p.y+p.h,p.z+p.d/2),local(sofa,p.x-p.w/2,p.y+p.h,p.z+p.d/2)])} fill={`url(#${outlineId}-cloth)`} stroke="#4e563d" strokeWidth=".45"/>}</g>);
      })()}
    </g>
    <g aria-label="Leafy floor plant beside the sofa" pointerEvents="none">
     {flatArt(sofa,-1.62,0,-.12,.8,<g transform="scale(1 1.45)">
      <ellipse cx="0" cy="0" rx="27" ry="7" fill="#111b1b" opacity=".3"/>
      <path d="M-25 -42Q-23 -8 -16 -2Q0 6 17 -2L25 -42Z" fill="#a16c45" stroke="#513b29" strokeWidth="2"/>
      <ellipse cy="-42" rx="25" ry="7" fill="#55432c" stroke="#c49a66" strokeWidth="3"/>
      <path d="M-21 -29Q0 -18 21 -29M-18 -13Q0 -3 18 -13" fill="none" stroke="#c29962" strokeWidth="2"/>
      {Array.from({length:11},(_,i)=>{const x=Number((Math.sin(i*2.4)*(25+i%3*7)).toFixed(4)),y=-63-i%4*18;return <g key={i}><path d={`M0 -40Q${x*.2} ${y} ${x} ${y}`} fill="none" stroke="#737a41" strokeWidth="2"/><path d={`M${x} ${y}q${i%2?26:-26} -22 ${i%2?30:-30} 7q-12 9 ${i%2?-30:30} -7`} fill={i%2?'#7e8949':'#53683e'} stroke="#303e2c" strokeWidth="1"/><path d={`M${x} ${y}l${i%2?24:-24} 4`} stroke="#a6a263" strokeWidth=".8"/></g>;})}
     </g>)}
    </g>
    <g className="arcade-fixture cockpit-interactive-fixture" role="button" aria-label="Play SOUL arcade" {...interaction('arcade',onArcade)}
      style={{pointerEvents:onArcade ? 'auto' : 'none'}}>
      <title>Arcade</title>
  {/* main upright cabinet */}
  {box(arcade,0,0,0,1.15,2.25,.72,'#303d46')}

  {/* slightly projecting control deck */}
  {box(arcade,0,1.02,-.43,1.12,.18,.34,'#46565e')}

  {/* Painted side graphic follows the existing side plane, not the screen. */}
  {flatArt(arcade,-.581,2.12,-.3,.64,<g>
    <path d="M8 39L-2 173 92 173 65 39Z" fill="#ffb0ff" opacity=".15"/>
    <path d="M18 43L13 166M35 43L40 170M54 43L71 161" stroke="#ffb0ff" strokeWidth="1.5" opacity=".55"/>
    <path d="M12 31Q18 5 43 12Q58 17 61 31" fill="#9d80a1" stroke="#ffb0ff" strokeWidth="2"/>
    <ellipse cx="36" cy="33" rx="34" ry="10" fill="#473754" stroke="#ffb0ff" strokeWidth="2"/>
    {[16,35,54].map(x=><circle key={x} cx={x} cy="34" r="2" fill="#c9b995"/>)}
    {[[29,77],[64,107],[24,139]].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y}) rotate(${i%2?18:-15})`}><path d="M0 -13C-24 -16 -23 9 0 23C23 9 24 -16 0 -13Z" fill="#83b9a4"/><ellipse cx="-8" cy="1" rx="4" ry="7" fill="#171e2c" transform="rotate(-20 -8 1)"/><ellipse cx="8" cy="1" rx="4" ry="7" fill="#171e2c" transform="rotate(20 8 1)"/></g>)}
    <path d="M75 142L65 154 78 151 68 165" fill="none" stroke="#ffb0ff" strokeWidth="2"/>
    <g transform="translate(35 185)"><path d="M-10 0C-16 -21 16 -21 10 0L7 7H-7Z" fill="#e8e4dd"/><circle cx="-5" cy="-5" r="3" fill="#151b29"/><circle cx="5" cy="-5" r="3" fill="#151b29"/><path d="M-3 3v4M3 3v4" stroke="#151b29"/></g>
  </g>,'side')}
  {flatArt(arcade,0,1.58,-.37,.92,<g>
    <rect x="-46" y="-39" width="92" height="78" rx="5" fill="#131722" stroke="#79627f" strokeWidth="3"/>
    <rect x="-40" y="-33" width="80" height="66" rx="3" fill="#00082d"/>
    <g transform="translate(0 -4)"><ellipse rx="24" ry="10" fill="none" stroke="#7fffd4" strokeWidth="2.4"/><path d="M50 86C42 76 20 62 14 45C8 28 18 12 35 13C44 14 49 22 50 25C51 22 56 14 65 13C82 12 92 28 86 45C80 62 58 76 50 86Z" transform="translate(-13 -13) scale(.26)" fill="#7fffd4"/></g>
  </g>)}
  {/* One physical joystick on the left and one raised button on the right. */}
  {flatArt(arcade,0,1.205,-.49,.82,<g><ellipse cx="-21" rx="10" ry="7" fill="#11141c" stroke="#866b57"/><ellipse cx="20" rx="8" ry="7" fill="#1a1722" stroke="#9e779e"/><ellipse cx="20" cy="-1" rx="6" ry="5" fill="#ffb0ff"/></g>,'horizontal')}
  {line(arcade,[-.172,1.205,-.49],[-.172,1.38,-.49],'#a48b69',2.2)}
  {flatArt(arcade,-.172,1.38,-.49,.17,<g><circle r="34" fill="#9b454b" stroke="#d18a81" strokeWidth="4"/><path d="M-22 -14Q-8 -29 9 -23" fill="none" stroke="#e2b1a1" strokeWidth="3" opacity=".6"/></g>)}
  {flatArt(arcade,0,.55,-.367,.43,<g>
    <rect x="-38" y="-36" width="76" height="76" rx="3" fill="#322d2a" stroke="#8c7055" strokeWidth="2"/>
    <rect x="-22" y="-24" width="44" height="25" rx="2" fill="#161b24" stroke="#a98a65"/><path d="M-11 -12H11" stroke="#060c14" strokeWidth="4"/>
    <rect x="-15" y="14" width="30" height="12" rx="2" fill="#141924" stroke="#74644f"/>
    {[-30,30].flatMap(x=>[-28,32].map(y=><circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill="#a58c6c"/>))}
  </g>)}
  {line(arcade,[-.55,2.23,-.36],[.55,2.23,-.36],'#ffb0ff',1.4)}
  {line(arcade,[-.55,1.2,-.6],[.55,1.2,-.6],'#ffb0ff',1)}
  {[-.48,-.16,.39].map((x,i)=><g key={x}>{line(arcade,[x,.12+i*.03,-.367],[x+.045,.13+i*.03,-.367],'#85786c',.7)}</g>)}
</g>
    <g className="merch-rail cockpit-interactive-fixture" role="button" aria-label="SOUL merchandise clothes rail" aria-expanded={domeMenu==='merch'} {...interaction('merch',onMerch)} style={{pointerEvents:onMerch ? 'auto' : 'none'}}>
      <title>THE MERCH</title>
      <path d={path([local(rail,-1.05,0,0),local(rail,1.05,0,0),local(rail,1.05,2.1,0),local(rail,-1.05,2.1,0)])} fill="transparent" pointerEvents="all" />
      {[
        ...[-1.05,1.05].flatMap(x=>[{a:[x,.04,-.38],b:[x,.04,.38],width:4},{a:[x,0,0],b:[x,2.1,0],width:4}]),
        {a:[-1.05,2.1,0],b:[1.05,2.1,0],width:5},
        {a:[-1.05,.15,0],b:[1.05,.15,0],width:2},
      ].map(({a,b,width},i)=><g key={i}>
        {line(rail,a,b,'#65502f',width)}
        {line(rail,a,b,`url(#${outlineId}-brass)`,width*.7)}
        <g opacity=".45">{line(rail,a,b,'#c3a574',width*.18)}</g>
      </g>)}
      <g pointerEvents="none" aria-hidden="true">
        {(() => {
          // Follow the existing frame in world space; keep the central shirt area open.
          const top=(t:number)=>local(rail,-1.05+2.1*t,2.09-.045*(1-Math.cos(t*Math.PI*8)), -.025);
          const side=(sign:number,t:number)=>local(rail,sign*1.05+.025*Math.sin(t*Math.PI*8),2.09-1.98*t,-.028);
          const strands=[Array.from({length:65},(_,i)=>top(i/64)),...[-1,1].map(sign=>Array.from({length:65},(_,i)=>side(sign,i/64)))];
          const bulbs=[...Array.from({length:14},(_,i)=>top((i+.3)/14)),...[-1,1].flatMap(sign=>Array.from({length:11},(_,i)=>side(sign,(i+.45)/11)))];
          return <>
            {strands.map((points,i)=><path key={i} d={path(points).replace(/Z$/,'')} fill="none" stroke="#b7a57b" strokeWidth=".65" strokeOpacity=".8"/>)}
            {[-1,1].map(sign=><g key={sign}>
              <path d={path(Array.from({length:40},(_,i)=>local(rail,sign*1.05+.034*Math.sin(i*.4),2.13-i*.045,-.04))).replace(/Z$/,'')} fill="none" stroke="#52603a" strokeWidth=".85"/>
              {Array.from({length:13},(_,i)=>{
                // Fixed irregular growth keeps the foliage stable during interaction.
                const heights=sign<0?[2.12,2.085,2.01,1.89,1.85,1.69,1.53,1.48,1.25,1.08,.99,.76,.61]:[2.115,2.055,2.025,1.91,1.76,1.72,1.55,1.32,1.27,1.04,.86,.8,.62];
                const variation=(n:number)=>{const v=Math.sin((i+1)*17.13+sign*8.7+n*31.71)*437.58;return v-Math.floor(v);};
                const y=heights[i],x=sign*1.05+.034*Math.sin((2.13-y)/.045*.4);
                const direction=variation(1)>.46?1:-1,size=.58+variation(2)*.62,angle=(variation(3)-.5)*1.25;
                const leaf=(dx:number,dy:number)=>local(rail,x+direction*size*(dx*Math.cos(angle)-dy*Math.sin(angle)),y+size*(dx*Math.sin(angle)+dy*Math.cos(angle)),-.045);
                const points=[leaf(0,0),leaf(.035,.055),leaf(.065,.04),leaf(.105,.065),leaf(.115,-.015),leaf(.06,-.055)];
                return <g key={i}><path d={paddedPath(points)} fill={i%3===0?'#77834c':i%3===1?'#536d43':'#657c49'} stroke="#374a30" strokeWidth=".45"/><path d={path([leaf(0,0),leaf(.09,.02)])} fill="none" stroke="#a0a56a" strokeWidth=".4" opacity=".5"/></g>;
              })}
            </g>)}
            {bulbs.map((point,i)=>{const p=project(point,config,view),r=p.scale*rail.scale*.012;return <g key={i}>
              <circle cx={p.x} cy={p.y} r={r*5} fill={`url(#${outlineId}-fairy-glow)`}/>
              <ellipse cx={p.x} cy={p.y} rx={r*.7} ry={r} fill="#fff0c6"/>
            </g>;})}
          </>;
        })()}
      </g>
      {flatArt(rail,-.15,2.1,-.035,1.2,<g aria-label="White SOUL Ringer Tee with red trim hanging on a hanger" pointerEvents="none">
        {/* Thin hanger hooks over the existing rail; the shirt drapes below it. */}
        <path d="M0 12 V5 C10 3 7 -7 1 -5 C-3 -4 -4 -1 -3 1" fill="none" stroke="#ad8d59" strokeWidth="1.7"/>
        <path d="M0 12 L-29 29 Q0 34 29 29 Z" fill="#503421" stroke="#35271c" strokeWidth="1.7" strokeLinejoin="round"/>
        <path d="M-24 28L0 16 24 28" fill="none" stroke="#906a43" strokeWidth="1"/>
        <path d="M-12 20 L-29 25 -49 44 -37 59 -26 51 -28 118 Q0 123 28 118 L26 51 37 59 49 44 29 25 12 20 Q0 29 -12 20Z" fill="#f7f6f2" stroke="#bac2c2" strokeWidth="1" strokeLinejoin="round" />
        <path d="M-12 20 Q0 29 12 20 L11 26 Q0 35 -11 26Z M-49 44 L-37 59 -33 55 -45 40Z M49 44 L37 59 33 55 45 40Z" fill="#c5102e" />
        <path d="M-24 52 Q-19 67 -24 108 M24 52 Q18 78 24 111 M-26 115 Q0 119 26 115" fill="none" stroke="#d8dcda" strokeWidth="1" />
        <path d="M-25 52Q-16 64 -22 95L-25 115Q-20 79 -25 52ZM24 51Q14 78 23 115L26 117Q21 85 24 51ZM-9 95Q-6 109 -12 119L-3 119Q-5 108 -9 95Z" fill="#8d9083" opacity=".12"/>
        <path d="M-17 57Q-10 79 -15 103M16 62Q12 87 18 108" fill="none" stroke="#fffdf5" strokeWidth="1.6" opacity=".55"/>
        {/* 30cm print on a 50cm body: roughly 60% of the torso width. */}
        <g fill="#17191a" transform="translate(0 60) scale(.57) translate(0 -60)">
          <path d="M-7 42 Q-11 48 -8 57 L-13 64 -11 73 -16 83 -10 97 8 98 13 91 10 78 18 69 15 65 8 69 6 59 Q13 50 6 44 L2 40Z" />
          <path d="M-22 61 Q-28 63 -25 73 L-29 81 -25 95 -13 98 -10 90 -16 82 -15 74 -18 71 Q-14 63 -22 61Z M20 61 Q13 63 17 72 L12 78 15 83 11 90 15 98 27 95 28 83 24 76 25 69 Q27 63 20 61Z" />
          <path d="M-27 89 Q-17 85 -8 91 L2 88 13 90 28 87 28 99 Q12 102 -2 99 L-27 100Z" />
        </g>
      </g>,'side')}
    </g>
    <g className="cockpit-interactive-fixture" role="button" aria-label="Open The Hyper-Fix" {...interaction('newsletter',onNewsletter)} style={{pointerEvents:onNewsletter ? 'auto' : 'none'}}>
      <title>The Hyper-Fix</title>
      {[-.78,.78].map(x=><g key={x}>{box(table,x,0,-.27,.09,.48,.09)}{box(table,x,0,.27,.09,.48,.09)}</g>)}
      {(() => {
        const rim = (height: number) => Array.from({length:65},(_,i) => local(table,1.05*Math.sin(i/64*Math.PI*2),height,1.05*Math.cos(i/64*Math.PI*2)));
        return <g stroke="#bc9865" strokeWidth="1"><path d={path(rim(.45))} fill="#62452d" /><path d={path(rim(.55))} fill={`url(#${outlineId}-wood)`} /></g>;
      })()}
      {[-.7,-.45,-.18,.12,.4,.66].map((z,i)=>{const w=Math.sqrt(1.05**2-z*z)*.91;return <path key={z} d={path(Array.from({length:25},(_,j)=>{const x=-w+j/24*w*2;return local(table,x,.553,z+.017*Math.sin(x*8+i));}))} fill="none" stroke={i%2?'#d2a470':'#66452d'} strokeOpacity=".28" strokeWidth=".65"/>;})}
      {!reading && <g className="newsletter-fixture">
      {box(table,-.17,.55,0,.51,.025,.74,'#eee5cd')}
      {flatArt(table,-.17,.58,.13,.43,<g><text textAnchor="middle" fill="#000" fontSize="14" fontFamily="HyperFixBlackletter, serif">The Hyper-Fix</text><text y="17" textAnchor="middle" fill="#222" fontSize="8">CURRENT ISSUE</text></g>,'horizontal')}
      </g>}
    </g>
  </svg>;
});

/** One rasterised spherical surface per poster; no triangle DOM or hover repaint mesh. */
const PosterArtwork=memo(function PosterArtwork({config,view}:{config:DomeConfig;view:Viewport}) {
 return <g>{UPCOMING_POSTERS.map(poster=><CurvedPoster key={poster.id} poster={poster} config={config} view={view} />)}</g>;
});
function CurvedPoster({poster,config,view}:{poster:typeof UPCOMING_POSTERS[number];config:DomeConfig;view:Viewport}) {
 const [image,setImage]=useState<Awaited<ReturnType<typeof rasterPoster>>|null>(null);
 const geometry=JSON.stringify({poster,config,view});
 useEffect(()=>{
  let active=true;
  const {poster,config,view}=JSON.parse(geometry);
  void rasterPoster(poster,config,view).then(result=>{if(active)setImage(result);});
  return ()=>{active=false;};
 },[geometry]);
 return image ? <image aria-label={poster.title} {...image} preserveAspectRatio="none" /> : null;
}
