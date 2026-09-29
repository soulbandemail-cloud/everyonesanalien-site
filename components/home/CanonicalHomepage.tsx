"use client";
import Image from 'next/image';
import ringerTee from '@/public/soul-ringer-tee.png';
import { useId, useRef, type CSSProperties } from 'react';
import MatePanel from '@/components/mate/MatePanel';
import { useDomeProjection } from './useDomeProjection';
import RealPlanetHeart from './RealPlanetHeart';
import ExteriorSpace from './ExteriorSpace';
import { exteriorPlane } from '@/lib/ship/exteriorSpace';
import DomeWishes from './DomeWishes';
import type { DomeConfig, Viewport } from '@/lib/ship/domeGeometry';
import {
  FaInstagram,
  FaSpotify,
  FaTiktok,
  FaYoutube,
  FaEnvelope,
} from "react-icons/fa";

export default function CanonicalHomepage({ cockpit, loginEnabled, config, view, animateEntry = false, camera = config, progress = cockpit ? 1 : 0, mobileThird=false, publicFrame }: { cockpit: boolean; loginEnabled: boolean; config: DomeConfig; view: Viewport; animateEntry?: boolean; camera?: DomeConfig; progress?: number; mobileThird?:boolean; publicFrame?:{view:Viewport;angle:number} }) {
 const teeOutlineId=useId();
 const homeRoot = useRef<HTMLDivElement>(null);
 // Blend the live header toward the final dome frame. The travelling eye crosses
 // that surface near its start; projecting through it would fling the header offscreen.
 useDomeProjection(homeRoot, cockpit, config, view, animateEntry, config, progress, mobileThird);
 return <div ref={homeRoot} className="canonical-home" data-dome-narrow={view.width<760 || undefined} data-returning={!cockpit && progress>0 ? "true" : undefined}>
 <ExteriorSpace config={config} camera={camera} view={view} />
 <svg width="0" height="0" aria-hidden="true" style={{position:'absolute',pointerEvents:'none'}}>
  <defs>
   <filter id={teeOutlineId} x="-100%" y="-100%" width="300%" height="300%" colorInterpolationFilters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="softSilhouette" />
    <feComponentTransfer in="softSilhouette" result="expanded"><feFuncA type="linear" slope="12" intercept="-1.5" /></feComponentTransfer>
    <feComposite in="expanded" in2="SourceAlpha" operator="out" result="edge" />
    <feFlood floodColor="#6ee7b7" result="mint" />
    <feComposite in="mint" in2="edge" operator="in" result="outline" />
    <feMerge><feMergeNode in="outline" /><feMergeNode in="SourceGraphic" /></feMerge>
   </filter>
  </defs>
 </svg>
 <main className="pink-text-glow min-h-screen text-white p-8 md:p-12 max-w-12xl mx-auto">
        <div data-dome-slot="socials" className="flex flex-nowrap justify-center gap-10 sm:gap-10 mb-0 md:mb-4">
          <a
            aria-label="Spotify"
            href="https://open.spotify.com/artist/4aoqsXn1YULl9y1boDeTZA?si=mPVXh9BtR4KvRUSQoIyJYA"
            target="_blank"
            rel="noopener noreferrer"
            className="pink-icon-glow transition-colors duration-200 hover:text-[#6ee7b7] active:text-[#6ee7b7]"
          >
            <FaSpotify size={48} />
          </a>

          <a
            aria-label="Instagram"
            href="https://www.instagram.com/everyonesanalien/"
            target="_blank"
            rel="noopener noreferrer"
            className="pink-icon-glow transition-colors duration-200 hover:text-[#6ee7b7] active:text-[#6ee7b7]"
          >
            <FaInstagram size={48} />
          </a>

          <a
            aria-label="TikTok"
            href="https://www.tiktok.com/@everyonesanalien?lang=en-GB"
            target="_blank"
            rel="noopener noreferrer"
            className="pink-icon-glow transition-colors duration-200 hover:text-[#6ee7b7] active:text-[#6ee7b7]"
          >
            <FaTiktok size={48} />
          </a>

          <a
            aria-label="YouTube"
            href="https://www.youtube.com/channel/UCTp_Wb8HBHWMQxXvNzxkksg"
            target="_blank"
            rel="noopener noreferrer"
            className="pink-icon-glow transition-colors duration-200 hover:text-[#6ee7b7] active:text-[#6ee7b7]"
          >
            <FaYoutube size={48} />
          </a>

          <a
            aria-label="Email"
            href="mailto:soul.band.email@gmail.com"
            className="pink-icon-glow transition-colors duration-200 hover:text-[#6ee7b7] active:text-[#6ee7b7]"
          >
            <FaEnvelope size={48} />
          </a>
        </div>

        <div data-dome-slot="brand" className="relative mt-8 mb-0 -mx-8 md:-mx-12 overflow-hidden">
          <p aria-label="a band called..." className="text-center text-white text-sm md:text-sm tracking-[0.2em] uppercase mb-[-0.7rem]">
            {Array.from("a band called...").map((letter,i)=><span key={i} data-dome-caption aria-hidden="true" className="inline-block whitespace-pre">{letter}</span>)}
          </p>
          

          <div className="flex items-center justify-center w-full mt-0">
            <svg data-dome-rules aria-hidden="true"><path fill="none" stroke="white" strokeWidth="2" /></svg>

            <h1 aria-label="SOUL" className="soul-wordmark relative z-10 font-bold text-center flex justify-center items-center text-white shrink-0">
              <span data-soul-letter="S">S<i data-ink-baseline /></span>

              <RealPlanetHeart />
              <span data-soul-letter="U">U<i data-ink-baseline /></span><span data-soul-letter="L">L<i data-ink-baseline /></span>
            </h1>

          </div>
        </div>

        <DomeWishes active={!cockpit} frame={publicFrame} spaceTransform={exteriorPlane(config,camera,view)} />

        <div className="grid gap-8 md:gap-16 md:grid-cols-3 mt-2 mb-4 md:mb-16">
          <section data-dome-slot="live" className="md:col-start-1 mt-4 md:mt-0 md:max-w-sm md:mx-auto">
            <h2 className="text-2xl mb-4">THE SHOWS</h2>


           <ul className="space-y-2">
              <li>
                <a
                  href="https://link.dice.fm/w4a23940adca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pink-border-glow inline-block border border-white bg-[#00082d] px-3 py-2 hover:bg-[#6ee7b7] hover:border-[#6ee7b7] hover:text-[#00082d] active:bg-[#6ee7b7] active:border-[#6ee7b7] active:text-[#00082d] transition-colors duration-200"
                >
                  The George Tavern, LONDON, 5th Oct
                </a>
              </li>
            </ul>

          </section>

          {!cockpit && <MatePanel enabled={loginEnabled} />}

          <section data-dome-slot="merch" className="md:col-start-3 md:max-w-sm md:mx-auto">
            <h2 className="text-2xl mb-4">THE MERCH</h2>

            <a href="https://square.link/u/lXbPiLpe" target="_blank" rel="noopener noreferrer" aria-label="Shop the SOUL Ringer Tee (opens in a new tab)" className="inline-block ringer-tee-display cockpit-interactive-fixture" aria-disabled="false" style={{"--fixture-hover-filter":`url(#${teeOutlineId})`} as CSSProperties}>
              <Image src={ringerTee} alt="SOUL Ringer Tee" width={180} className="h-auto max-w-full" />
            </a>

          </section>
        </div>






 </main>
 </div>;
}
