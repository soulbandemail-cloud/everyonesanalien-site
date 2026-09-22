"use client";
import { useRef } from 'react';
import MatePanel from '@/components/mate/MatePanel';
import { useDomeProjection } from './useDomeProjection';
import PlanetHeart from './PlanetHeart';
import PortableTV from './PortableTV';
import DomeWishes from './DomeWishes';
import type { DomeConfig, Viewport } from '@/lib/ship/domeGeometry';
import {
  FaInstagram,
  FaSpotify,
  FaTiktok,
  FaYoutube,
  FaEnvelope,
} from "react-icons/fa";

export default function CanonicalHomepage({ cockpit, loginEnabled, config, view, animateEntry = false }: { cockpit: boolean; loginEnabled: boolean; config: DomeConfig; view: Viewport; animateEntry?: boolean }) {
 const homeRoot = useRef<HTMLDivElement>(null);
 useDomeProjection(homeRoot,cockpit,config,view,animateEntry);
 return <div ref={homeRoot} className="canonical-home">
 {!cockpit && <div className="site-atmosphere">      <div className="stars">
        <span className="star star-1"></span>
        <span className="star star-2"></span>
        <span className="star star-3"></span>
        <span className="star star-4"></span>
        <span className="star star-5"></span>
      </div>

<PortableTV />



</div>}
 <main className="pink-text-glow min-h-screen text-white p-8 md:p-12 max-w-12xl mx-auto">
        <div data-dome-slot="socials" className="flex flex-nowrap justify-center gap-10 sm:gap-10 mb-0 md:mb-4">
          <a
            href="https://open.spotify.com/artist/4aoqsXn1YULl9y1boDeTZA?si=mPVXh9BtR4KvRUSQoIyJYA"
            target="_blank"
            rel="noopener noreferrer"
            className="pink-icon-glow transition-all duration-200 hover:text-[#6ee7b7] active:text-[#6ee7b7]"
          >
            <FaSpotify size={48} />
          </a>

          <a
            href="https://www.instagram.com/everyonesanalien/"
            target="_blank"
            rel="noopener noreferrer"
            className="pink-icon-glow transition-all duration-200 hover:text-[#6ee7b7] active:text-[#6ee7b7]"
          >
            <FaInstagram size={48} />
          </a>

          <a
            href="https://www.tiktok.com/@everyonesanalien?lang=en-GB"
            target="_blank"
            rel="noopener noreferrer"
            className="pink-icon-glow transition-all duration-200 hover:text-[#6ee7b7] active:text-[#6ee7b7]"
          >
            <FaTiktok size={48} />
          </a>

          <a
            href="https://www.youtube.com/channel/UCTp_Wb8HBHWMQxXvNzxkksg"
            target="_blank"
            rel="noopener noreferrer"
            className="pink-icon-glow transition-all duration-200 hover:text-[#6ee7b7] active:text-[#6ee7b7]"
          >
            <FaYoutube size={48} />
          </a>

          <a
            href="mailto:soul.band.email@gmail.com"
            className="pink-icon-glow transition-all duration-200 hover:text-[#6ee7b7] active:text-[#6ee7b7]"
          >
            <FaEnvelope size={48} />
          </a>
        </div>

        <div data-dome-slot="brand" className="relative mt-8 mb-0 -mx-8 md:-mx-12 overflow-hidden">
          <p className="text-center text-white text-sm md:text-sm tracking-[0.2em] uppercase mb-[-0.7rem]">
            a band called...
          </p>
          

          <div className="flex items-center justify-center w-full mt-0">
            <div className="pink-line-glow h-[4px] bg-white flex-1 mr-2" />

            <h1 className="relative z-10 text-6xl font-bold text-center flex justify-center items-center text-white shrink-0">
              <span className="-mr-4">S</span>

              <PlanetHeart />
              <span className="-ml-3">UL</span>
            </h1>

            <div className="pink-line-glow h-[4px] bg-white flex-1 ml-2" />
          </div>
        </div>

        {!cockpit && <DomeWishes />}

        <div className="grid gap-8 md:gap-16 md:grid-cols-3 mt-2 mb-4 md:mb-16">
          <section data-dome-slot="live" className="md:col-start-1 mt-4 md:mt-0 md:max-w-sm md:mx-auto">
            <h2 className="text-2xl mb-4">THE SHOWS</h2>


           <ul className="space-y-2">
              <li>
                <a
                  href="https://link.dice.fm/w4a23940adca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pink-border-glow inline-block border border-white px-3 py-2 hover:bg-[#6ee7b7] hover:border-[#6ee7b7] hover:text-[#00082d] active:bg-[#6ee7b7] active:border-[#6ee7b7] active:text-[#00082d] transition-all duration-200"
                >
                  The George Tavern, LONDON, 5th Oct
                </a>
              </li>
            </ul>

          </section>

          {!cockpit && <MatePanel enabled={loginEnabled} />}

          <section data-dome-slot="merch" className="md:col-start-3 md:max-w-sm md:mx-auto">
            <h2 className="text-2xl mb-4">THE MERCH</h2>

            <p>
              Coming soon
              <span className="animate-pulse">_</span>
            </p>

          </section>
        </div>






 </main>
 </div>;
}
