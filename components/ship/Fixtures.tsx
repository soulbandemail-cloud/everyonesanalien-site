import { memo } from 'react';
import { project, type DomeConfig, type Vec3, type Viewport } from '@/lib/ship/domeGeometry';
import { polygonPath } from '@/lib/ship/roomGeometry';
import { FIXTURES, orientedFixtures, type FixturePlacement } from '@/lib/ship/fixtureLayout';
import styles from './ship.module.css';

type Props = { config: DomeConfig; view: Viewport; onArcade?: () => void };

/** Crude world-space solids: no owned items, controls, playback or inventory state. */
export const Fixtures = memo(function Fixtures({ config, view, onArcade }: Props) {
  const path = (points: Vec3[]) => polygonPath(points, config, view);
  const local = (f: FixturePlacement, x: number, y: number, z: number): Vec3 => ({
    x: f.x + f.scale * (x * (f.widthScale ?? 1) * Math.cos(f.yaw) + z * Math.sin(f.yaw)),
    y: f.y + y * f.scale,
    z: f.z + f.scale * (z * Math.cos(f.yaw) - x * (f.widthScale ?? 1) * Math.sin(f.yaw)),
  });
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
    return <g stroke="#849396" strokeWidth="1" strokeLinejoin="round">{faces.map((face,i) => <path key={i} d={path(face.points)} fill={face.fill} />)}</g>;
  }

  function line(f: FixturePlacement, a: number[], b: number[], colour = '#a1aeac', width = 3) {
    return <path d={path([local(f,a[0],a[1],a[2]),local(f,b[0],b[1],b[2])])} fill="none" stroke={colour} strokeWidth={width} strokeLinecap="round" />;
  }
  function label(f: FixturePlacement, text: string, y: number, z = 0, x = 0) {
    return flatArt(f,x,y,z,1,<text textAnchor="middle" fill="#bdccc7" fontSize="13" letterSpacing="1">{text}</text>);
  }
  function flatArt(f: FixturePlacement, x: number, y: number, z: number, width: number, children: React.ReactNode, plane: 'vertical' | 'horizontal' = 'vertical') {
    const p = project(local(f,x,y,z), config, view);
    if (!p.visible) return null;
    if (f === FIXTURES.radio) return <g transform={`translate(${p.x} ${p.y}) scale(${(p.scale * f.scale * width / 100).toFixed(6)})`}>{children}</g>;
    // Small illustrated details inherit the local surface's perspective basis,
    // rather than remaining camera-facing billboards or being spun in screen space.
    const unit = width / 100;
    const right = project(local(f,x+unit,y,z), config, view);
    const down = project(local(f,x,plane === 'vertical' ? y-unit : y,plane === 'horizontal' ? z-unit : z), config, view);
    const matrix = [right.x-p.x,right.y-p.y,down.x-p.x,down.y-p.y,p.x,p.y].map(n=>n.toFixed(6)).join(' ');
    return <g transform={`matrix(${matrix})`}>{children}</g>;
  }
  const fixtures = orientedFixtures(config.centre, config.radius);
const radio = fixtures.radio, music = fixtures.musicStation, sofa = fixtures.sofa;
const rail = fixtures.clothesRail, table = fixtures.coffeeTable, arcade = fixtures.arcade;
  return <svg className={styles.fixtures} width={view.width} height={view.height} role="group" aria-label="Empty base ship fixtures: radio left, gramophone and empty record cabinet right, empty sofa left, empty clothes rail right, coffee table with current Hyper-Fix foremost">
    <g aria-label="Portable TV placed on the left side of the pilot console">
  {box(radio,0,0,0,1.05,.58,.38,'#655f5c')}

  {flatArt(
    radio,
    0,
    .26,
    -.2,
    .95,
    <g>
      {/* screen border */}
      <rect
        x="-45"
        y="-21"
        width="90"
        height="42"
        rx="4"
        fill="#7b8787"
      />

      {/* thumbnail fills almost the entire frontage */}
      <image
        href="/tv-poster.png"
        x="-42"
        y="-18"
        width="84"
        height="36"
        preserveAspectRatio="xMidYMid slice"
      />
    </g>
  )}

  {/* carry handle — left */}
  {line(radio,[-.43,.58,0],[-.39,.76,0],'#a2aaa5',2)}
  {line(radio,[-.39,.76,0],[-.10,.76,0],'#a2aaa5',2)}
  {line(radio,[-.10,.76,0],[-.06,.58,0],'#a2aaa5',2)}

  {/* symmetrical bunny ears — right */}
  {line(radio,[.25,.58,.1],[.10,.98,.1],'#a2aaa5',2)}
  {line(radio,[.25,.58,.1],[.40,.98,.1],'#a2aaa5',2)}
</g>
    <g aria-label="Music station: gramophone left, empty sleeve display right, empty horizontal record shelves below">
      {/* Open-front cabinet. Shelves run horizontally, with vertical storage clearance. */}
      {box(music,0,0,.24,2.85,1.15,.09,'#26353f')}
      {box(music,-1.4,0,0,.12,1.2,.75)}
      {box(music,1.4,0,0,.12,1.2,.75)}
      {box(music,0,.03,0,2.8,.09,.75)}
      {box(music,0,.56,0,2.8,.07,.75)}
      {box(music,0,1.14,0,3,.12,.9)}
      {label(music,'EMPTY RECORD STORAGE',.28,-.4)}
      {box(music,-.72,1.26,0,1.2,.13,.65,'#675f57')}
      {flatArt(music,-.72,1.41,-.12,.95,<g><ellipse cx="0" cy="0" rx="33" ry="33" fill="#86918c" stroke="#283940" strokeWidth="2" /><circle r="2" fill="#1b2931" /><path d="M39 -9 L27 -2 L20 5" fill="none" stroke="#d0c9b4" strokeWidth="3" /></g>,'horizontal')}
      {flatArt(music,-.83,1.4,.14,1.35,<g stroke="#918a72" strokeWidth="2"><path d="M10 0 C34 -23 4 -30 -3 -44 L-21 -43 C-17 -24 13 -20 0 0" fill="#897f66" /><path d="M-13 -37 L-48 -70 Q-28 -96 4 -85 L6 -42 Z" fill="#b4a68a" /><ellipse cx="-23" cy="-77" rx="29" ry="12" transform="rotate(-17 -23 -77)" fill="#594f46" /></g>)}
      {/* Only a low empty sleeve ledge and support; no sleeve-shaped album placeholder. */}
      {box(music,.8,1.27,-.21,.95,.045,.14,'#9b9d91')}
      {line(music,[.8,1.3,.18],[.8,1.85,.25],'#748581',2)}
      {label(music,'SLEEVE SPACE',1.31,-.35,.8)}
    </g>
    <g aria-label="Empty sofa on left main floor">
      {box(sofa,0,.12,.34,2.65,1.05,.35,'#59686a')}
      {box(sofa,0,.12,-.05,2.7,.43,1.05,'#556565')}
      {box(sofa,-1.29,.24,-.08,.28,.61,1.06,'#687577')}
      {box(sofa,1.29,.24,-.08,.28,.61,1.06,'#687577')}
      {box(sofa,-.58,.55,-.12,1.08,.12,.86,'#748083')}
      {box(sofa,.58,.55,-.12,1.08,.12,.86,'#748083')}
    </g>
    <g role="button" tabIndex={onArcade ? 0 : -1} aria-label="Play SOUL arcade" aria-disabled={!onArcade}
      style={{pointerEvents:onArcade ? 'auto' : 'none', cursor:'pointer'}} onClick={onArcade}
      onKeyDown={event => { if (onArcade && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onArcade(); } }}>
      <title>SOUL arcade — play</title>
  {/* main upright cabinet */}
  {box(arcade,0,0,0,1.15,2.25,.72,'#303d46')}

  {/* slightly projecting control deck */}
  {box(arcade,0,1.02,-.43,1.12,.18,.34,'#46565e')}

  {/* recessed arcade screen */}
  {flatArt(
    arcade,
    0,
    1.58,
    -.37,
    .92,
    <g>
      <rect
        x="-46"
        y="-39"
        width="92"
        height="78"
        rx="5"
        fill="#111a22"
        stroke="#849396"
        strokeWidth="3"
      />

      <rect
        x="-40"
        y="-33"
        width="80"
        height="66"
        rx="3"
        fill="#00082d"
        stroke="#7fffd4"
        strokeWidth="2"
      />

      <ellipse cx="0" cy="-10" rx="22" ry="8" fill="none" stroke="#7fffd4" strokeWidth="2" />
      <path d="M0 0 C-22 -15 -8 -29 0 -17 C8 -29 22 -15 0 0Z" fill="#7fffd4" />
      <ellipse cx="-26" cy="20" rx="5" ry="7" fill="#7fffd4" />
      <ellipse cx="26" cy="20" rx="5" ry="7" fill="#7fffd4" />
      <text
        y="23"
        textAnchor="middle"
        fill="#bdccc7"
        fontSize="10"
        letterSpacing="2"
      >
        PLAY
      </text>
    </g>
  )}

  {/* simple controls for now */}
  {flatArt(
    arcade,
    0,
    1.12,
    -.62,
    .82,
    <g>
      <circle
        cx="-21"
        cy="0"
        r="7"
        fill="#7fffd4"
        stroke="#263640"
        strokeWidth="2"
      />

      <circle
        cx="20"
        cy="0"
        r="6"
        fill="#b0bcb4"
        stroke="#263640"
        strokeWidth="2"
      />
    </g>,
    'horizontal'
  )}
</g>
    <g aria-label="Empty clothes rail on right main floor; no hangers or clothes">
      {[-1.05,1.05].map(x=><g key={x}>{line(rail,[x,.04,-.38],[x,.04,.38],'#879c9c',4)}{line(rail,[x,0,0],[x,2.1,0],'#879c9c',4)}</g>)}
      {line(rail,[-1.05,2.1,0],[1.05,2.1,0],'#b0bcb4',5)}
      {line(rail,[-1.05,.15,0],[1.05,.15,0],'#61787b',2)}
    </g>
    <g aria-label="Foremost coffee table with the current Hyper-Fix, a permanent ship fixture">
      {[-.78,.78].map(x=><g key={x}>{box(table,x,0,-.27,.09,.48,.09)}{box(table,x,0,.27,.09,.48,.09)}</g>)}
      {(() => {
        const rim = (height: number) => Array.from({length:65},(_,i) => local(table,1.05*Math.sin(i/64*Math.PI*2),height,1.05*Math.cos(i/64*Math.PI*2)));
        return <g stroke="#849396" strokeWidth="1"><path d={path(rim(.45))} fill="#45565f" /><path d={path(rim(.55))} fill="#6b7777" /></g>;
      })()}
      {box(table,-.17,.55,0,.82,.025,.61,'#d2c9b3')}
      {flatArt(table,-.17,.58,-.1,.67,<g><text textAnchor="middle" fill="#263b40" fontSize="14" fontWeight="bold">HYPER-FIX</text><text y="17" textAnchor="middle" fill="#435955" fontSize="8">CURRENT ISSUE</text></g>,'horizontal')}
    </g>
  </svg>;
});
