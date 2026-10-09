"use client";
import {useEffect,useRef} from "react";
import {paintSky} from "@/lib/ship/starfield";
import './exterior.css';
import { type DomeConfig, type Viewport } from '@/lib/ship/domeGeometry';
import { exteriorPlane } from '@/lib/ship/exteriorSpace';

/** Persistent exterior stars; the one planet is anchored in the live SOUL wordmark. */
export default function ExteriorSpace({config,camera,view}:{config:DomeConfig;camera:DomeConfig;view:Viewport}) {
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{if(canvas.current)paintSky(canvas.current);},[]);
 return <div className="exterior-space" aria-hidden="true">
  <div className="exterior-star-plane" style={{transform:exteriorPlane(config,camera,view)}}>
   <canvas ref={canvas} className="exterior-sky" />
  </div>
 </div>;
}
