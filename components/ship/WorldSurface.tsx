'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {releaseSurface,drawSurface,surfaceBounds,surfaceImage,type WorldMesh} from '@/lib/ship/worldSurface';
import {project,type DomeConfig,type Viewport} from '@/lib/ship/domeGeometry';
export function WorldSurface({mesh,config,view,src,label,blockFloor=false,material}:{mesh:WorldMesh;config:DomeConfig;view:Viewport;src?:string;label?:string;blockFloor?:boolean;material?:{color:readonly number[];bias:readonly number[]}}){
 const canvas=useRef<HTMLCanvasElement|null>(null),paint=useRef<SVGImageElement>(null),[image,setImage]=useState<{src:string;image?:HTMLImageElement}|null>(null);
 const bounds=surfaceBounds(mesh,config,view);
 useEffect(()=>()=>releaseSurface(mesh),[mesh]);
 useEffect(()=>{if(!src)return;let active=true;void surfaceImage(src).then(image=>{if(active)setImage({src,image});}).catch(()=>{if(active)setImage({src});});return()=>{active=false;};},[src]);
 useLayoutEffect(()=>{
  if(!paint.current||(src&&image?.src!==src))return;
  canvas.current??=document.createElement('canvas');
  if(src&&!image?.image){canvas.current.getContext('2d')?.clearRect(0,0,canvas.current.width,canvas.current.height);}else drawSurface(canvas.current,mesh,config,view,image?.image,material);
  // Native SVG images participate in the same painter order and masks as furniture.
  // foreignObject canvases can escape that stack in WebKit. Publish pixels and their
  // matching projection together, synchronously, so no stale async camera result wins.
  const target=paint.current;
  target.setAttribute('x',String(bounds.x));target.setAttribute('y',String(bounds.y));
  target.setAttribute('width',String(parseFloat(canvas.current.style.width)||bounds.width));
  target.setAttribute('height',String(parseFloat(canvas.current.style.height)||bounds.height));
  target.setAttribute('href',canvas.current.toDataURL('image/png'));
  target.dataset.sceneReady='true';
 },[mesh,config,view,src,image,material,bounds.x,bounds.y,bounds.width,bounds.height]);
 // Match the convex upholstered surface, not its rectangular canvas, for floor blocking.
 const points:ReturnType<typeof project>[]=[];
 if(blockFloor)for(const p of mesh.points)points.push(project(p,config,view));
 points.sort((a,b)=>a.x-b.x||a.y-b.y);
 const half=(list:typeof points)=>{const hull:typeof points=[];for(const p of list){while(hull.length>1){const a=hull[hull.length-2],b=hull[hull.length-1];if((b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x)>0)break;hull.pop();}hull.push(p);}return hull.slice(0,-1);};
 const outline=blockFloor?[...half(points),...half(points.slice().reverse())].map(p=>`${p.x},${p.y}`).join(' '):'';
 return <g><image ref={paint} data-scene-ready="false" pointerEvents="none" aria-label={label} preserveAspectRatio="none"/>{blockFloor&&<polygon data-sofa-floor-blocker points={outline} fill="transparent" pointerEvents="all" onClick={event=>event.stopPropagation()} style={{cursor:'default'}}/>}</g>;
}
