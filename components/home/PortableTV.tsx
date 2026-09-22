"use client";
import { useState } from 'react';
import { usePortableTv } from './usePortableTv';
export default function PortableTV() {
 const {tvRef, tvPos, tvExpanded, setTvExpanded, dragTv} = usePortableTv();
 const [tvStarted, setTvStarted] = useState(false);
return tvPos && (
  <aside
    ref={tvRef}
    className={`space-tv ${tvExpanded ? "space-tv-expanded" : ""}`}
    style={{
      left: tvExpanded ? "0px" : `${tvPos?.x ?? 0}px`,
      top: tvExpanded ? "0px" : `${tvPos?.y ?? 0}px`,
    }}
    onPointerDown={(e) => {
      if (tvExpanded) {
        if (e.target === e.currentTarget) {
          setTvExpanded(false);
        }

        return;
      }
    }}
    aria-label="Floating space TV"
  >
    <div className="space-tv-top">
      <div
        role="button"
        tabIndex={0}
        className="space-tv-handle"
        aria-label="Move TV"
        onPointerDown={dragTv}
      />
      <span className="space-tv-antenna" aria-hidden="true" />
    </div>

    <div className="space-tv-body">
      <div
        className="space-tv-screen"
        onPointerDownCapture={() => {
          if (!tvExpanded) {
            setTvStarted(true);
            setTvExpanded(true);
          }
        }}
      >
        <iframe
          key={tvStarted ? "tv-started" : "tv-poster"}
          src={`https://www.tiktok.com/embed/v2/7623124860574731543?autoplay=1&muted=1&playsinline=1&start=${tvStarted ? "1" : "0"}`}
          title="SOUL music video"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="eager"
          className="space-tv-video"
        />
        {!tvStarted && <div className="space-tv-poster" aria-hidden="true" />}
        <div className="space-tv-scanlines" />
      </div>
    </div>
  </aside>
);

}
