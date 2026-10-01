import {lens,radians,type DomeConfig,type Viewport} from './domeGeometry';
import {posterSurfacePoint} from './posterProjection';
export type PosterSurface={theta:number;latitude:number;width:number;aspect:number};
/** Inverse camera ray → inner sphere → poster UV. No triangulation or seams. */
export function posterUv(p:PosterSurface,x:number,y:number,c:DomeConfig,v:Viewport) {
 const {focal,horizon}=lens(c,v),pitch=radians(c.pitch);
 const dx=(x-v.width/2)/focal,up=(horizon-y)/focal;
 const dy=up*Math.cos(pitch)+Math.sin(pitch),dz=Math.cos(pitch)-up*Math.sin(pitch);
 const ox=c.camera.x-c.centre.x,oy=c.camera.y-c.centre.y,oz=c.camera.z-c.centre.z,r=c.radius-.08;
 const a=dx*dx+dy*dy+dz*dz,b=ox*dx+oy*dy+oz*dz,disc=b*b-a*(ox*ox+oy*oy+oz*oz-r*r);
 if(disc<0)return null;
 const t=(-b+Math.sqrt(disc))/a;
 if(t<=0)return null;
 const theta=Math.atan2(ox+t*dx,oz+t*dz),phi=Math.asin((oy+t*dy)/r);
 const u=.5+(theta-p.theta)*r*Math.cos(p.latitude)/p.width,vv=.5-(phi-p.latitude)*r/(p.width*p.aspect);
 return u>=0 && u<=1 && vv>=0 && vv<=1 ? {u,v:vv} : null;
}
export function posterBounds(p:PosterSurface,c:DomeConfig,v:Viewport) {
 const points=[];
 for(let i=0;i<=32;i++)for(const [u,w] of [[i/32,0],[i/32,1],[0,i/32],[1,i/32]])points.push(posterSurfacePoint(p,u,w,c,v));
 const x=Math.min(...points.map(p=>p.x))-1,y=Math.min(...points.map(p=>p.y))-1;
 return {x,y,width:Math.max(...points.map(p=>p.x))-x+1,height:Math.max(...points.map(p=>p.y))-y+1};
}
const sources=new Map<string,Promise<ImageData>>();
function sourcePixels(src:string) {
 if(!sources.has(src))sources.set(src,new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>{
   const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
   const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);resolve(ctx.getImageData(0,0,canvas.width,canvas.height));
  };image.onerror=reject;image.src=src;
 }));
 return sources.get(src)!;
}
/** Bake once per camera/viewport, then hover/press transforms one ordinary image. */
export async function rasterPoster(p:PosterSurface & {src:string},c:DomeConfig,v:Viewport) {
 const source=await sourcePixels(p.src),bounds=posterBounds(p,c,v);
 const scale=Math.min(4,1000/Math.max(bounds.width,bounds.height));
 const canvas=document.createElement('canvas');canvas.width=Math.ceil(bounds.width*scale);canvas.height=Math.ceil(bounds.height*scale);
 const ctx=canvas.getContext('2d')!,out=ctx.createImageData(canvas.width,canvas.height);
 for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++) {
  const uv=posterUv(p,bounds.x+(x+.5)/canvas.width*bounds.width,bounds.y+(y+.5)/canvas.height*bounds.height,c,v);
  if(!uv)continue;
  const sx=uv.u*(source.width-1),sy=uv.v*(source.height-1),ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;
  const target=(y*canvas.width+x)*4;
  for(let k=0;k<4;k++) {
   const sample=(xx:number,yy:number)=>source.data[(Math.min(yy,source.height-1)*source.width+Math.min(xx,source.width-1))*4+k];
   out.data[target+k]=(sample(ix,iy)*(1-fx)+sample(ix+1,iy)*fx)*(1-fy)+(sample(ix,iy+1)*(1-fx)+sample(ix+1,iy+1)*fx)*fy;
  }
 }
 ctx.putImageData(out,0,0);
 return {...bounds,href:canvas.toDataURL('image/png')};
}
