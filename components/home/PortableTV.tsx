"use client";
import { useImperativeHandle, useState, type Ref } from 'react';
export type TvController = { open:()=>void };
export default function PortableTV({dock,controllerRef}:{dock?:{x:number;y:number;scale:number};controllerRef?:Ref<TvController>} = {}) {
 const [tvExpanded, setTvExpanded] = useState(false);
 const [tvStarted, setTvStarted] = useState(false);
 useImperativeHandle(controllerRef,()=>({open(){setTvStarted(true);setTvExpanded(true);}}),[]);
return (
  <aside
    data-console={!!dock || undefined}
    style={dock && !tvExpanded ? {left:dock.x,top:dock.y,right:'auto',bottom:'auto',width:84,height:36,transform:`scale(${dock.scale})`,transformOrigin:'0 0','--tv-dock-scale':dock.scale} as React.CSSProperties : undefined}
    className={`space-tv ${tvExpanded ? "space-tv-expanded" : ""}`}
    onPointerDown={(e) => {
      if (tvExpanded) {
        if (e.target === e.currentTarget) {
          setTvExpanded(false);
        }

        return;
      }
    }}
    aria-label="Space TV"
  >
    <div className="space-tv-top">
      <span className="space-tv-antenna" aria-hidden="true" />
    </div>

    <div className="space-tv-body">
      <div className="space-tv-screen">
        <iframe
          src={`https://www.tiktok.com/embed/v2/7623124860574731543?autoplay=1&muted=1&playsinline=1&start=${tvStarted ? "1" : "0"}`}
          title="SOUL music video"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="eager"
          className="space-tv-video"
        />
        {!tvStarted && <div className="space-tv-poster" aria-hidden="true" />}
        <div className="space-tv-scanlines" />
        {!tvExpanded && !dock && <button type="button" className="space-tv-open" aria-label="Maximise TV" onClick={()=>{setTvStarted(true);setTvExpanded(true);}} />}
      </div>
    </div>
    {tvExpanded && <button type="button" className="space-tv-close object-back" onClick={()=>setTvExpanded(false)}>BACK</button>}
  </aside>
);

}
