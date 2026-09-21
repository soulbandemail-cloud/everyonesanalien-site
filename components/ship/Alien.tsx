import type { CSSProperties } from 'react';
import styles from './ship.module.css';
export type Attention = { x: number; back: number; down: number };
export function Alien({ attention }: { attention: Attention }) {
 const yaw = attention.back * 180 + attention.x * (1 - attention.back * .7) * 22;
 return <div className={styles.alien} style={{ '--yaw': `${yaw}deg`, '--pitch': `${attention.down * 18}deg` } as CSSProperties} aria-label="Seated alien sharing your attention"><div className={styles.swivel}><div className={`${styles.alienSide} ${styles.alienBack}`}><AlienDrawing front={false} /></div><div className={`${styles.alienSide} ${styles.alienFront}`}><AlienDrawing front /></div></div><div className={styles.chairBase} /></div>;
}
function AlienDrawing({ front }: { front: boolean }) {
 return <svg viewBox="0 0 180 250" aria-hidden="true">
 <path d="M56 205 Q36 230 55 244 M124 205 Q145 230 126 244" fill="none" stroke="#78c7ab" strokeWidth="10" strokeLinecap="round" />
 <path d="M64 145 Q38 151 37 185 M116 145 Q143 151 144 185" fill="none" stroke="#7fffd4" strokeWidth="8" strokeLinecap="round" />
 <path d="M65 141 Q90 131 115 141 L124 208 Q90 221 56 208 Z" fill={front ? '#ead9d8' : '#284345'} stroke="#0c1c25" strokeWidth="3" />
 {front ? <text x="90" y="184" textAnchor="middle" fill="#172c31" fontSize="20" fontFamily="monospace">SOUL</text> : <rect x="58" y="164" width="64" height="56" rx="17" fill="#20313c" stroke="#758d8f" strokeWidth="3" />}
 <g style={{ transformOrigin: '90px 120px', transform: 'rotateX(var(--pitch))' }}><path d="M63 37 Q54 17 45 15 M117 37 Q128 17 135 15" fill="none" stroke="#7fffd4" strokeWidth="4" /><circle cx="45" cy="15" r="5" fill="#b6ffe5" /><circle cx="135" cy="15" r="5" fill="#b6ffe5" />
 <path d="M90 30 C29 28 23 64 39 96 Q65 140 90 143 Q115 140 141 96 C157 64 151 28 90 30" fill={front ? '#92e8c9' : '#69bfa6'} stroke="#213c3c" strokeWidth="3" />
 {front && <><ellipse cx="62" cy="83" rx="14" ry="23" fill="#071520" transform="rotate(-25 62 83)" /><ellipse cx="118" cy="83" rx="14" ry="23" fill="#071520" transform="rotate(25 118 83)" /><path d="M81 120 Q90 125 99 120" fill="none" stroke="#244d48" strokeWidth="2" /></>}
 </g></svg>;
}
