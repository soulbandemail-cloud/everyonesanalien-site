import type { CSSProperties, ReactNode } from 'react';
import { FaSpotify, FaInstagram, FaTiktok, FaYoutube, FaEnvelope } from 'react-icons/fa';
import { domePoint, type DomeConfig, type Viewport } from '@/lib/ship/domeGeometry';
import { domePageLayout } from '@/lib/ship/domePageLayout';
import { Heart } from './Artwork';
import Link from 'next/link';
import styles from './ship.module.css';
const socials = [ { icon: FaSpotify, label: 'Spotify', href: 'https://open.spotify.com/artist/4aoqsXn1YULl9y1boDeTZA' }, { icon: FaInstagram, label: 'Instagram', href: 'https://www.instagram.com/everyonesanalien/' }, { icon: FaTiktok, label: 'TikTok', href: 'https://www.tiktok.com/@everyonesanalien' }, { icon: FaYoutube, label: 'YouTube', href: 'https://www.youtube.com/channel/UCTp_Wb8HBHWMQxXvNzxkksg' }, { icon: FaEnvelope, label: 'Email', href: 'mailto:soul.band.email@gmail.com' } ];
export function DomePage({ config, view }: { config: DomeConfig; view: Viewport }) {
 const layout = domePageLayout(config);
 function anchor(theta: number, phi: number): CSSProperties {
  const p = domePoint(theta, phi, config, view);
  return { left: p.x, top: p.y, visibility: p.visible ? 'visible' : 'hidden', transform: `translate(-50%, -50%) scale(${Math.min(1.25, Math.max(.6, p.scale / 40))})` };
 }
 function item(theta: number, phi: number, content: ReactNode) { return <div className={styles.projected} style={anchor(theta, phi)}>{content}</div>; }
 return <div className={styles.domePage}>
 {item(0, layout.socials, <div className={styles.socials}>{socials.map(({ icon: Icon, label, href }) => <a key={label} aria-label={label} href={href} target="_blank" rel="noreferrer"><Icon /></a>)}</div>)}
 {item(0, layout.brand, <><p className={styles.eyebrow}>a band called...</p><h1 className={styles.brand}>S<span><Heart /></span>UL</h1></>)}
 {item(0, layout.information, <><p className={styles.welcome}>EVERYONE&apos;S AN ALIEN</p><Link className={styles.mate} href="/">Become a Mate ↗</Link></>)}
 {item(-.67, layout.information, <div className={styles.navItem}><span>01 / TRANSMISSION</span><Link href="/">HYPER-FIX ↗</Link><small>Back to the domepage</small></div>)}
 {item(.67, layout.information, <div className={styles.navItem}><span>02 / ON EARTH</span><a href="https://link.dice.fm/w4a23940adca" target="_blank" rel="noreferrer">LIVE ↗</a><small>The George Tavern<br />London · 5th Oct</small></div>)}
 {item(0, layout.merch, <div className={styles.navItem}><span>03 / MERCH</span><small>Coming soon_</small></div>)}
 </div>;
}
