import {useEffect,useRef} from 'react';
export type SofaVertex={x:number;y:number;depth:number;shade:number};
export type SofaTriangle=readonly [SofaVertex,SofaVertex,SofaVertex];
/** Static, smoothly interpolated vertex lighting. Rasterise only when geometry/camera changes,
 * not on the cockpit animation loop. Shared edge pixels use a depth buffer, with no polygon strokes. */
export function SofaSmoothSurface({triangles}:{triangles:SofaTriangle[]}){
 const image=useRef<SVGImageElement>(null);
 useEffect(()=>{
  const vertices=triangles.flat(),x=Math.floor(Math.min(...vertices.map(p=>p.x)))-1,y=Math.floor(Math.min(...vertices.map(p=>p.y)))-1;
  const width=Math.ceil(Math.max(...vertices.map(p=>p.x)))-x+1,height=Math.ceil(Math.max(...vertices.map(p=>p.y)))-y+1;
  const ratio=Math.min(3,Math.max(2,window.devicePixelRatio||1)),canvas=document.createElement('canvas');
  canvas.width=Math.ceil(width*ratio);canvas.height=Math.ceil(height*ratio);
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const pixels=ctx.createImageData(canvas.width,canvas.height),depth=new Float32Array(canvas.width*canvas.height).fill(Infinity);
  for(const triangle of triangles){
   const [a,b,c]=triangle.map(p=>({...p,x:(p.x-x)*ratio,y:(p.y-y)*ratio}));
   const det=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(det)<1e-8)continue;
   const left=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),right=Math.min(canvas.width-1,Math.ceil(Math.max(a.x,b.x,c.x)));
   const top=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),bottom=Math.min(canvas.height-1,Math.ceil(Math.max(a.y,b.y,c.y)));
   for(let py=top;py<=bottom;py++)for(let px=left;px<=right;px++){
    const u=((b.y-c.y)*(px+.5-c.x)+(c.x-b.x)*(py+.5-c.y))/det,v=((c.y-a.y)*(px+.5-c.x)+(a.x-c.x)*(py+.5-c.y))/det,w=1-u-v;
    if(u<-.00001||v<-.00001||w<-.00001)continue;
    const index=py*canvas.width+px,z=u*a.depth+v*b.depth+w*c.depth;if(z>depth[index])continue;
    depth[index]=z;const shade=u*a.shade+v*b.shade+w*c.shade;
    pixels.data[index*4]=Math.round(76*shade);pixels.data[index*4+1]=Math.round(86*shade);pixels.data[index*4+2]=Math.round(55*shade);pixels.data[index*4+3]=255;
   }
  }
  ctx.putImageData(pixels,0,0);
  for(const [key,value] of Object.entries({href:canvas.toDataURL(),x,y,width,height}))image.current?.setAttribute(key,String(value));
 },[triangles]);
 return <image ref={image} pointerEvents="none"/>;
}
